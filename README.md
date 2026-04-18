# Tab Harbor

Tab Harbor is a Microsoft Edge / Chromium MV3 extension that turns the new-tab page into a focused tab workspace.

It groups open tabs, surfaces duplicates, supports keyboard-first cleanup, lets you defer tabs into a Later Dock, and can capture full workspace snapshots for restore.

## Current Scope

- New-tab workspace override
- Domain and custom-rule grouping
- Duplicate detection and cleanup
- Batch tab actions
- Drag-to-reorder group priority
- Pin groups to the top
- Keyboard navigation and quick search
- Later Dock, archive, and recent-closure restore
- Workspace snapshots with export, import, auto-save, tags, and notes
- Edge-ready MV3 build through WXT + TypeScript

## Project Layout

- `typed-src/`: main application source
- `assets/`: static project assets
- `wxt.config.ts`: WXT build config
- `package.json`: local scripts

## Development

```bash
npm install
npm run typecheck
npm run build
```

For local iteration:

```bash
npm run dev:edge
```

## Load In Edge

1. Open `edge://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select `.output/edge-mv3`

Note: `.output` is a hidden directory because it starts with a dot.

## Package For Release

```bash
npm run zip
```

This produces:

- `.output/tab-harbor-edge-mv3.zip`

## GitHub Upload Notes

Do not commit:

- `node_modules/`
- `.output/`
- `.wxt/`

Only commit source, config, lockfile, and docs.
