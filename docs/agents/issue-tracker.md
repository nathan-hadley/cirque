# Issue tracker: GitHub

Issues live in this repo's GitHub Issues. Use `gh`.

## Assets must be on GitHub

This repo is worked from more than one machine, so a local-only file is lost to every other session. Never link a file from an issue, or close an issue on one, until it's pushed.

- Findings that fit in a comment go in the comment, sources included.
- Bigger files: commit, push, and link the blob URL on the branch the file is actually on. Don't link `blob/main/...` for a file that isn't on main yet.
- Confirm the link resolves before closing: `gh api "repos/{owner}/{repo}/contents/<path>?ref=<branch>"`.

## Wayfinding operations

The sub-issue and dependency endpoints take an issue's database id (`gh api repos/{owner}/{repo}/issues/<n> --jq .id`), not its number or `node_id`.

- **Map**: an issue labelled `wayfinder:map`.
- **Tickets**: sub-issues of the map, labelled `wayfinder:<type>`. `gh api --method POST repos/{owner}/{repo}/issues/<map>/sub_issues -F sub_issue_id=<child-db-id>`.
- **Blocking**: native dependencies. `gh api --method POST repos/{owner}/{repo}/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`.
- **Frontier**: open sub-issues of the map (`gh api repos/{owner}/{repo}/issues/<map>/sub_issues`) with no assignee and `issue_dependencies_summary.blocked_by` of 0, in map order.
