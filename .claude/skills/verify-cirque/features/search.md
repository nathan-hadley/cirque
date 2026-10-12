# Problem search

The search bar on the Map tab opens a full-screen search. Typing filters problems by name, and choosing a result closes search, flies the map to the problem, and opens its detail sheet.

## Sub-features

- `search-open` the search bar opens the search overlay with a focused input.
- `search-match` typing a problem name lists matching results.
- `search-open-result` choosing a result opens the problem detail sheet with its name, grade, and circuit number.

## How to get to it (user POV)

- Tap the `Search problems...` bar at the top of the Map tab.

## Driving it with Maestro

Preconditions:

- Baseline preconditions from the index.
- The seed contains `The Shallow`, V0, problem `#1` on the Forestland Black circuit, id `80faa6a3-b46a-5bff-8c77-1887c4712264`.

- **All of it.** Run `verify.ts test <platform> 02-search`. JUnit marks `Search and open a problem` passed.
- **Open search.** `tapOn: { id: open-problem-search }`. The overlay shows `problem-search-input`.
- **Type a query.** `tapOn: { id: problem-search-input, optional: true }` then `inputText: "The Shallow"`. The input autofocuses, and iOS doesn't expose its id, so the tap is optional. A result with id `problem-search-result-<problem id>` appears.
- **Open the result.** `tapOn: { id: problem-search-result-80faa6a3-b46a-5bff-8c77-1887c4712264 }`, then `extendedWaitUntil: { visible: "The Shallow", timeout: 10000 }`. The sheet shows `V0` and `#1`.
- **Proof.** In a scratch flow, `takeScreenshot: search-results` after typing and `takeScreenshot: problem-sheet` after the sheet opens.

## Gotchas

- Result ids are problem UUIDs from the seed. Look one up in `react-native/assets/seed.json` when proving a different problem.
- The detail sheet is a native TrueSheet that animates in. Assert after `extendedWaitUntil`, not right after the tap.
- Results each carry the accessibility label `Select <problem name>`, which is handy in `maestro hierarchy` output.
