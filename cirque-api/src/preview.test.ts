import { describe, expect, test } from "vitest";
import { devClientUrl, previewPage } from "./preview";

const GROUP = "47839bf2-9e01-467b-9378-4a978604ab11";
const BUILD = "675cb1f0-fa3c-11e8-ac99-6374d9643cb2";

describe("devClientUrl", () => {
  test("points the dev variant's scheme at the update group", () => {
    expect(devClientUrl(GROUP)).toBe(
      "cirque-dev://expo-development-client/?url=https%3A%2F%2Fu.expo.dev%2F4c69e3f4-e42c-471b-8ee6-6c292a478d71%2Fgroup%2F47839bf2-9e01-467b-9378-4a978604ab11",
    );
  });
});

describe("previewPage", () => {
  test("auto-opens the update when no new build is needed", () => {
    const html = previewPage(GROUP, undefined)!;
    expect(html).toContain(`location.href = "${devClientUrl(GROUP)}"`);
    expect(html).not.toContain("Install build");
  });

  test("asks for the install first when the PR needed a new build", () => {
    const html = previewPage(GROUP, BUILD)!;
    expect(html).toContain(`https://expo.dev/accounts/nathanhadley/projects/Cirque/builds/${BUILD}`);
    expect(html).not.toContain("location.href");
  });

  test.each([
    ["<script>", undefined],
    [GROUP, "not-a-build"],
    [GROUP, `${BUILD}"><script>`],
  ])("rejects non-uuid ids (%s, %s)", (groupId, buildId) => {
    expect(previewPage(groupId, buildId)).toBeNull();
  });
});
