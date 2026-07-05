import { describe, expect, test } from "vitest";
import { backupKeysToPrune, buildBackup } from "./backup.mjs";

describe("buildBackup", () => {
  test("produces a dated versioned key and full-fidelity JSON body", () => {
    const problems = [
      { id: "p1", name: "X", status: "rejected", submitted_by_email: "pii@example.com" },
    ];
    const documents = [{ name: "areas", geojson: "{}", updated_at: "2026-07-01" }];

    const { key, body } = buildBackup(problems, documents, new Date("2026-07-04T09:00:00Z"));

    expect(key).toBe("backups/2026-07-04.json");
    const parsed = JSON.parse(body);
    expect(parsed.problems).toEqual(problems); // backup keeps PII and rejected rows
    expect(parsed.documents).toEqual(documents);
    expect(parsed.created_at).toBe("2026-07-04T09:00:00.000Z");
  });
});

describe("backupKeysToPrune", () => {
  test("keeps the last 30 days, prunes older, ignores non-backup keys", () => {
    const keys = [
      "backups/2026-07-04.json", // today
      "backups/2026-06-05.json", // 29 days old — keep
      "backups/2026-06-04.json", // 30 days old — prune
      "backups/2025-01-01.json", // ancient — prune
      "backups/garbage.txt", // unparseable — leave alone
    ];
    expect(backupKeysToPrune(keys, new Date("2026-07-04T09:00:00Z"))).toEqual([
      "backups/2026-06-04.json",
      "backups/2025-01-01.json",
    ]);
  });
});
