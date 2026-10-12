#!/usr/bin/env node
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, openSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Platform = "ios" | "android";

interface State {
  ios?: { udid: string };
  android?: { serial: string; pid: number; avd: string };
  builds?: Partial<Record<Platform, { commit: string; dirty: boolean; at: string }>>;
}

const APP_ID = "com.nathanhadley.Cirque";
const ANDROID_PORT = 5584;
const ANDROID_SERIAL = `emulator-${ANDROID_PORT}`;
const IOS_DEVICE_TYPE = process.env.CIRQUE_IOS_DEVICE ?? "iPhone 17 Pro";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const appDir = join(repoRoot, "react-native");
const workDir = join(repoRoot, ".tmp/verify-cirque");
const statePath = join(workDir, "state.json");
const artifactsRoot = join(workDir, "artifacts");
const iosAppPath = join(appDir, "ios/build/Build/Products/Release-iphonesimulator/Cirque.app");
const apkPath = join(appDir, "android/app/build/outputs/apk/release/app-release.apk");

const androidHome =
  process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? join(process.env.HOME ?? "", "Library/Android/sdk");
const adbBin = join(androidHome, "platform-tools/adb");
const emulatorBin = join(androidHome, "emulator/emulator");

const DEFAULT_FLOWS: Record<Platform, string[]> = {
  android: ["01-launch-and-tabs.yml", "02-search.yml", "03-map-and-circuit.yml", "04-grade-filter.yml"],
  ios: ["01-launch-and-tabs.yml", "02-search.yml", "04-grade-filter.yml"],
};

function readState(): State {
  return existsSync(statePath) ? (JSON.parse(readFileSync(statePath, "utf8")) as State) : {};
}

function writeState(state: State) {
  mkdirSync(workDir, { recursive: true });
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
}

function run(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, { stdio: "inherit", cwd: opts.cwd, env: { ...process.env, ...opts.env } });
  if (res.status !== 0) throw new Error(`${cmd} exited with ${res.status}`);
}

function capture(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function adb(...args: string[]) {
  return capture(adbBin, ["-s", ANDROID_SERIAL, ...args]);
}

function gitHead() {
  return {
    commit: capture("git", ["-C", repoRoot, "rev-parse", "--short", "HEAD"]),
    dirty: capture("git", ["-C", repoRoot, "status", "--porcelain", "--", "react-native"]) !== "",
  };
}

function pidAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function deviceId(platform: Platform): string {
  const state = readState();
  if (platform === "ios") {
    if (!state.ios) throw new Error("No iOS simulator for this run. Run `boot ios` first.");
    return state.ios.udid;
  }
  if (!state.android) throw new Error("No Android emulator for this run. Run `boot android` first.");
  return state.android.serial;
}

function depsHoisted() {
  return existsSync(join(appDir, "node_modules/@babel/plugin-transform-react-jsx"));
}

function build(platform: Platform) {
  if (!existsSync(join(appDir, ".env.local"))) {
    throw new Error("react-native/.env.local is missing. Copy it from the main checkout (needs EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN).");
  }
  if (!depsHoisted()) {
    run("rm", ["-rf", join(appDir, "node_modules")]);
    run("npx", ["-y", "pnpm@10", "install", "--frozen-lockfile"], { cwd: appDir });
  }

  const nativeDir = join(appDir, platform);
  const isProdProject =
    platform === "ios"
      ? existsSync(join(nativeDir, "Cirque.xcworkspace"))
      : existsSync(join(nativeDir, "app/build.gradle")) &&
        readFileSync(join(nativeDir, "app/build.gradle"), "utf8").includes(`applicationId '${APP_ID}'`);
  const prebuildArgs = ["expo", "prebuild", "--platform", platform];
  if (existsSync(nativeDir) && !isProdProject) prebuildArgs.push("--clean");
  const env = { APP_VARIANT: "", NODE_ENV: "production", CI: "1" };
  run("npx", prebuildArgs, { cwd: appDir, env });

  if (platform === "ios") {
    run(
      "xcodebuild",
      [
        "-workspace", "ios/Cirque.xcworkspace",
        "-scheme", "Cirque",
        "-configuration", "Release",
        "-sdk", "iphonesimulator",
        "-destination", "generic/platform=iOS Simulator",
        "-derivedDataPath", "ios/build",
        "-quiet",
        "CODE_SIGNING_ALLOWED=NO",
        "IPHONEOS_DEPLOYMENT_TARGET=15.1",
        "build",
      ],
      { cwd: appDir, env },
    );
  } else {
    run(
      "./android/gradlew",
      ["-p", "android", "assembleRelease", "-PreactNativeArchitectures=arm64-v8a", "-x", "lintVitalRelease", "--quiet"],
      { cwd: appDir, env: { ...env, ANDROID_HOME: androidHome } },
    );
  }

  const state = readState();
  state.builds = { ...state.builds, [platform]: { ...gitHead(), at: new Date().toISOString() } };
  writeState(state);
  console.log(`Built ${platform === "ios" ? iosAppPath : apkPath}`);
}

function latestIosRuntime(): string {
  const runtimes = JSON.parse(capture("xcrun", ["simctl", "list", "runtimes", "-j"])).runtimes as {
    identifier: string;
    platform: string;
    isAvailable: boolean;
  }[];
  const ios = runtimes.filter((r) => r.platform === "iOS" && r.isAvailable);
  if (ios.length === 0) throw new Error("No available iOS simulator runtime. Install one in Xcode > Settings > Components.");
  return ios[ios.length - 1].identifier;
}

function boot(platform: Platform, flags: Set<string>) {
  const state = readState();
  if (platform === "ios") {
    if (state.ios) throw new Error(`iOS simulator ${state.ios.udid} already belongs to this run. Run \`cleanup ios\` first.`);
    const udid = capture("xcrun", ["simctl", "create", `cirque-verify-${Date.now()}`, IOS_DEVICE_TYPE, latestIosRuntime()]);
    if (!udid) throw new Error(`simctl create failed for device type "${IOS_DEVICE_TYPE}". Set CIRQUE_IOS_DEVICE to one from \`xcrun simctl list devicetypes\`.`);
    writeState({ ...state, ios: { udid } });
    console.log(`Booting iOS simulator ${udid}, a fresh one takes about a minute`);
    if (spawnSync("xcrun", ["simctl", "bootstatus", udid, "-b"], { stdio: "ignore" }).status !== 0) {
      throw new Error(`Simulator ${udid} failed to boot. Run \`cleanup ios\` and retry.`);
    }
    if (flags.has("--window")) run("open", ["-a", "Simulator", "--args", "-CurrentDeviceUDID", udid]);
    console.log(`iOS simulator ready: ${udid}`);
    return;
  }

  if (state.android) throw new Error(`Android emulator ${state.android.serial} already belongs to this run. Run \`cleanup android\` first.`);
  if (capture(adbBin, ["devices"]).includes(ANDROID_SERIAL)) {
    throw new Error(`${ANDROID_SERIAL} is already running and this run didn't start it. Leave it alone; stop it yourself if it's stale.`);
  }
  const avd = process.env.CIRQUE_AVD ?? capture(emulatorBin, ["-list-avds"]).split("\n").filter(Boolean)[0];
  if (!avd) throw new Error("No AVD found. Create one in Android Studio or set CIRQUE_AVD.");
  mkdirSync(workDir, { recursive: true });
  const log = openSync(join(workDir, "emulator.log"), "w");
  const args = ["-avd", avd, "-port", String(ANDROID_PORT), "-read-only", "-no-snapshot-save", "-no-boot-anim", "-no-audio"];
  if (!flags.has("--window")) args.push("-no-window");
  const child = spawn(emulatorBin, args, { detached: true, stdio: ["ignore", log, log] });
  child.unref();
  writeState({ ...state, android: { serial: ANDROID_SERIAL, pid: child.pid!, avd } });
  const deadline = Date.now() + 180_000;
  while (adb("shell", "getprop", "sys.boot_completed") !== "1") {
    if (!pidAlive(child.pid!)) throw new Error(`Emulator exited during boot. See ${join(workDir, "emulator.log")}`);
    if (Date.now() > deadline) throw new Error("Emulator didn't finish booting in 180s.");
    sleep(2000);
  }
  adb("shell", "settings", "put", "global", "hide_error_dialogs", "1");
  console.log(`Android emulator ready: ${ANDROID_SERIAL} (${avd}, pid ${child.pid})`);
}

function install(platform: Platform) {
  const id = deviceId(platform);
  if (platform === "ios") {
    if (!existsSync(iosAppPath)) throw new Error(`No iOS build at ${iosAppPath}. Run \`build ios\` first.`);
    run("xcrun", ["simctl", "install", id, iosAppPath]);
  } else {
    if (!existsSync(apkPath)) throw new Error(`No APK at ${apkPath}. Run \`build android\` first.`);
    run(adbBin, ["-s", id, "install", "-r", apkPath]);
  }
}

function doctor(platforms: Platform[]) {
  const state = readState();
  const head = gitHead();
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    console.log(`${pass ? "ok  " : "FAIL"} ${msg}`);
    if (!pass) ok = false;
  };
  check(capture("maestro", ["--version"]) !== "", `maestro on PATH (${capture("maestro", ["--version"]) || "missing"})`);
  check(existsSync(join(appDir, ".env.local")), "react-native/.env.local present");
  check(depsHoisted(), "node_modules installed with babel hoisting (pnpm 10 reads react-native/.npmrc)");

  for (const p of platforms) {
    const built = state.builds?.[p];
    const artifact = p === "ios" ? iosAppPath : apkPath;
    check(existsSync(artifact), `${p} release build exists`);
    if (built) {
      const fresh = built.commit === head.commit && !built.dirty && !head.dirty;
      console.log(`${fresh ? "ok  " : "warn"} ${p} build from ${built.commit}${built.dirty ? " (dirty)" : ""} at ${built.at}; HEAD is ${head.commit}${head.dirty ? " (dirty)" : ""}${fresh ? "" : ". Rebuild if react-native/ changed since."}`);
    }

    if (p === "ios") {
      const udid = state.ios?.udid;
      const booted = udid ? capture("xcrun", ["simctl", "list", "devices", "booted"]).includes(udid) : false;
      check(booted, `iOS simulator owned by this run is booted${udid ? ` (${udid})` : " (none recorded)"}`);
      if (booted) check(capture("xcrun", ["simctl", "get_app_container", udid!, APP_ID]) !== "", `${APP_ID} installed on simulator`);
    } else {
      const a = state.android;
      const alive = a ? pidAlive(a.pid) && adb("shell", "getprop", "sys.boot_completed") === "1" : false;
      check(alive, `Android emulator owned by this run is booted${a ? ` (${a.serial}, pid ${a.pid})` : " (none recorded)"}`);
      if (alive) {
        check(adb("shell", "pm", "path", APP_ID) !== "", `${APP_ID} installed on emulator`);
        const wifi = adb("shell", "settings", "get", "global", "wifi_on");
        console.log(`info emulator wifi_on=${wifi}`);
      }
    }
  }
  if (!ok) process.exitCode = 1;
}

function runId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function test(platform: Platform, flows: string[]) {
  const id = deviceId(platform);
  const names = flows.length > 0 ? flows : DEFAULT_FLOWS[platform];
  const out = join(artifactsRoot, `${runId()}-${platform}`);
  mkdirSync(out, { recursive: true });
  const offline = names.some((f) => f.includes("05-contribute"));
  if (offline) {
    if (platform === "ios") {
      throw new Error("05-contribute submits to the production API when online, and the iOS simulator has no network toggle. Run it on Android only.");
    }
    adb("shell", "svc", "wifi", "disable");
    adb("shell", "svc", "data", "disable");
  }
  const flowPaths = names.map((f) =>
    f.includes("/") ? resolve(f) : join(appDir, ".maestro", f.endsWith(".yml") ? f : `${f}.yml`),
  );
  const res = spawnSync(
    "maestro",
    ["--device", id, "test", ...flowPaths, "--format", "JUNIT", "--output", join(out, "report.xml"), "--test-output-dir", out, "--debug-output", join(out, "debug")],
    { stdio: "inherit", cwd: appDir },
  );
  screenshot(platform, join(out, "final.png"));
  if (platform === "android") {
    const fd = openSync(join(out, "logcat.txt"), "w");
    spawnSync(adbBin, ["-s", id, "logcat", "-d", "-b", "main,system,crash"], { stdio: ["ignore", fd, "ignore"] });
  }
  if (offline) console.log("Emulator left offline on purpose: the queued submission would post to prod on reconnect. `cleanup android` discards it.");
  console.log(`Evidence: ${out}`);
  process.exitCode = res.status ?? 1;
}

function screenshot(platform: Platform, path?: string) {
  const id = deviceId(platform);
  const dest = path ?? join(artifactsRoot, `${runId()}-${platform}.png`);
  mkdirSync(dirname(dest), { recursive: true });
  if (platform === "ios") {
    capture("xcrun", ["simctl", "io", id, "screenshot", dest]);
  } else {
    writeFileSync(dest, execFileSync(adbBin, ["-s", id, "exec-out", "screencap", "-p"], { maxBuffer: 64 * 1024 * 1024 }));
  }
  console.log(`Screenshot: ${dest}`);
}

function cleanup(platforms: Platform[]) {
  const state = readState();
  for (const p of platforms) {
    if (p === "ios" && state.ios) {
      capture("xcrun", ["simctl", "shutdown", state.ios.udid]);
      capture("xcrun", ["simctl", "delete", state.ios.udid]);
      console.log(`Deleted iOS simulator ${state.ios.udid}`);
      delete state.ios;
    }
    if (p === "android" && state.android) {
      const { pid, serial } = state.android;
      if (pidAlive(pid)) {
        capture(adbBin, ["-s", serial, "emu", "kill"]);
        for (let i = 0; i < 15 && pidAlive(pid); i++) sleep(1000);
        if (pidAlive(pid)) process.kill(pid, "SIGKILL");
      }
      console.log(`Stopped Android emulator ${serial} (pid ${pid})`);
      delete state.android;
    }
  }
  writeState(state);
  console.log(`Artifacts kept in ${artifactsRoot}`);
}

function parsePlatforms(arg: string | undefined, allowBoth: boolean): Platform[] {
  if (arg === "ios" || arg === "android") return [arg];
  if (allowBoth && (arg === undefined || arg === "all")) return ["ios", "android"];
  throw new Error(`Expected platform ios|android${allowBoth ? "|all" : ""}, got ${arg ?? "nothing"}`);
}

const [command, platformArg, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const positional = rest.filter((a) => !a.startsWith("--"));

try {
  switch (command) {
    case "build":
      parsePlatforms(platformArg, true).forEach(build);
      break;
    case "boot":
      parsePlatforms(platformArg, true).forEach((p) => boot(p, flags));
      break;
    case "install":
      parsePlatforms(platformArg, true).forEach(install);
      break;
    case "doctor":
      doctor(parsePlatforms(platformArg, true));
      break;
    case "test":
      test(parsePlatforms(platformArg, false)[0], positional);
      break;
    case "screenshot":
      screenshot(parsePlatforms(platformArg, false)[0], positional[0]);
      break;
    case "cleanup":
      cleanup(parsePlatforms(platformArg, true));
      break;
    default:
      console.log("Usage: node .claude/skills/verify-cirque/scripts/verify.ts <build|boot|install|doctor|test|screenshot|cleanup> <ios|android|all> [args]");
      process.exitCode = command ? 1 : 0;
  }
} catch (err) {
  console.error(`error: ${(err as Error).message}`);
  process.exitCode = 1;
}
