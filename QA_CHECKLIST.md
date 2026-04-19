# Tab Harbor QA Checklist

## Smoke

- Load the unpacked extension from `.output/edge-mv3`.
- Open a new tab and confirm the redesigned workspace dashboard renders without layout breaks.
- Open the options page and confirm settings load without console errors.

## Search And Filters

- Search by tab title, hostname, and stack name.
- Clear search with the `Clear` button and `/` plus `Esc`.
- Switch between `Smart` and `Recent` and confirm the visible order changes as expected.
- Enable `Duplicates only` and confirm only duplicate tabs remain visible.
- Switch between `Merged` and `By window` and confirm stacks split correctly.

## Selection And Bulk Actions

- Select a single tab with the row control.
- Select an entire stack.
- Select all visible tabs, then clear selection.
- Move selected tabs to `Later`.
- Move selected tabs to a new window.
- Close selected tabs and confirm only the visible selected set is affected.

## Stack Actions

- Pin and unpin a stack.
- Drag stacks to a new order and refresh the page to confirm persistence.
- Close a single tab.
- Close a full stack.
- Close only duplicates inside a stack.

## Snapshots

- Export a snapshot with name, tags, and note.
- Edit an existing snapshot.
- Delete a snapshot from the new dialog flow.
- Restore a snapshot and confirm windows, active tabs, and focused window come back correctly.
- Import an invalid snapshot file and confirm the UI shows an error instead of breaking.

## Later, Recent, Archive

- Move a tab to `Later`, mark it `Done`, and confirm it appears in `Archive`.
- Dismiss a `Later` item.
- Close a stack and restore it from `Recent closures`.
- Dismiss a recent closure entry.

## Settings

- Save hidden domains and confirm matching tabs disappear from the board after refresh.
- Save valid custom group rules and confirm matching tabs stack together.
- Save valid landing page rules and confirm those tabs collapse into the landing stack.
- Enter invalid JSON in settings and confirm save is blocked with a visible error list.

## Regression

- Reload the extension and confirm pinned stacks, stack order, snapshots, and settings persist.
- Confirm `Recent` ordering still reflects activation behavior after using the browser normally.
- Confirm wide screens and smaller windows both keep readable spacing and no action overflow.
