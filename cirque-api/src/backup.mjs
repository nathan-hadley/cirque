// Scheduled backup (ADR 0001 §Migration 6): full-fidelity dataset snapshot
// (all statuses, PII included) to a versioned R2 prefix. Complements D1's
// 30-day time travel. Never served publicly — /images/* allowlists topos/ only.
// Bounded retention: backups hold PII, so old snapshots are pruned rather
// than accumulating forever. 30 days matches D1 time travel.
export function backupKeysToPrune(keys, now, keepDays = 30) {
  const cutoff = `backups/${new Date(now.getTime() - keepDays * 86400_000).toISOString().slice(0, 10)}.json`;
  return keys.filter((k) => /^backups\/\d{4}-\d{2}-\d{2}\.json$/.test(k) && k <= cutoff);
}

export function buildBackup(problemRows, documentRows, now) {
  return {
    key: `backups/${now.toISOString().slice(0, 10)}.json`,
    body: JSON.stringify({
      created_at: now.toISOString(),
      problems: problemRows,
      documents: documentRows,
    }),
  };
}
