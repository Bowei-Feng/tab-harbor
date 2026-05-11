# Tab Harbor

`Tab Harbor` is a Manifest V3 browser extension for Microsoft Edge and other Chromium browsers.

It replaces the default new-tab page with a workspace for tab triage:

- group open tabs into stacks
- surface duplicate tabs
- batch move or close visible results
- park overflow into a `Later` queue
- recover a full workspace from snapshots

The goal is not to build a decorative new-tab page. The goal is to make heavy browser sessions easier to read, clean up, and restore.

## What It Does

- Replaces the browser new-tab page with a tab workspace
- Groups tabs by domain, custom rules, landing-page rules, and user-defined aliases
- Merges stacks when multiple groups resolve to the same visible name
- Detects duplicate tabs and supports duplicate-only cleanup
- Supports search across titles, URLs, domains, and stack names
- Supports batch actions on the current visible scope
- Moves selected tabs to `Later` or to a new window
- Stores recent closures and lightweight archive history
- Saves, imports, exports, and restores workspace snapshots
- Supports pinned stacks, drag reorder, and stack rename persistence
- Includes an options page for grouping and visibility rules

## Stack

- `WXT`
- `TypeScript`
- `Vitest`
- `Manifest V3`

## Architecture

The project is intentionally split into a few layers:

- `typed-src/lib/domain`
  Pure domain logic such as grouping, normalization, settings, and snapshot modeling.
- `typed-src/lib/storage`
  Storage repositories for settings, snapshots, aliases, pinned groups, recent closures, and related state.
- `typed-src/lib/platform`
  Browser-facing APIs such as tab and window operations.
- `typed-src/lib/app`
  App state, store, and higher-level actions that coordinate domain logic with platform and storage.
- `typed-src/lib/ui`
  Rendering and presentation logic for the new-tab page and options page.
- `typed-src/entrypoints`
  Actual extension entrypoints: background, new-tab page, and options page.
- `public`
  Static files copied into the final extension package. This is where extension icons now live.

## Project Layout

```text
tab-harbor/
├─ public/                     # static assets copied to the build output
├─ typed-src/
│  ├─ entrypoints/             # background, newtab, options
│  └─ lib/
│     ├─ app/                  # store and app actions
│     ├─ domain/               # grouping, settings, snapshots
│     ├─ platform/             # browser tab/window API wrapper
│     ├─ storage/              # repositories over browser storage
│     └─ ui/                   # renderer, presenter, shared UI helpers
├─ QA_CHECKLIST.md
├─ package.json
└─ wxt.config.ts
```

## Development

Install dependencies:

```bash
npm install
```

Run the basic checks:

```bash
npm test
npm run typecheck
npm run build
```

Run the extension in development mode:

```bash
npm run dev:edge
```

Clean generated output:

```bash
npm run clean
```

## Load In Edge

1. Open `edge://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `.output/edge-mv3`

Notes:

- `.output` is a hidden directory because it starts with `.`
- On macOS Finder, press `Command + Shift + .` if hidden folders are not visible

## Packaging

Build a zip package:

```bash
npm run zip
```

Output:

- `.output/tab-harbor-edge-mv3.zip`

## Testing

Automated checks:

- `npm test`
- `npm run typecheck`
- `npm run build`

Manual regression checklist:

- [QA_CHECKLIST.md](./QA_CHECKLIST.md)

## Current Notes

- The UI is optimized for desktop browser tab management, not mobile-style layouts.
- New-tab takeover depends on the browser profile and extension state. If Edge falls back to its default new-tab page, reload the unpacked extension from `.output/edge-mv3`.
- Snapshot, archive, and recent-closure behavior is intentionally local. Nothing is synced to a remote service.

## Recent Structure Cleanup

This repository has already been trimmed from an earlier prototype into a single WXT + TypeScript code path.

Recent structure improvements include:

- shared brand markup between new-tab and options pages
- shared HTML escaping helpers
- UI copy extracted from render templates into dedicated modules
- static extension icons moved into `public/` so build output is always loadable by Edge

## License

No license file is currently included in this repository.
