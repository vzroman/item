# Collection Views

The data-bound list and grid views under `item.view.collections.*` — `Flex`, `ItemList`, `Grid`, `TreeGrid`. Each binds to a `controllers.Collection` and renders one child per row. Read [views-foundation](views-foundation.md) first — these all extend the collection view base described there.

## Contents
- [Overview](#overview)
- [Flex](#flex)
- [ItemList](#itemlist)
- [Grid](#grid)
  - [Column definition](#column-definition)
  - [Header & footer](#header--footer)
  - [Selection](#selection)
  - [Paging](#paging)
- [TreeGrid](#treegrid)
- [Gotchas](#gotchas)

## Overview

All four views bind to a [`controllers.Collection`](data-controllers.md#controllerscollection) passed as the `data` option and render **one child view per row**, keeping the DOM in sync via the collection's `add`/`edit`/`remove` events (see [The collection view base](views-foundation.md#the-collection-view-base) — they implement `newItem`, and inherit `addItem`/`removeItem` methods and events). Each row is linked to a forked per-row child controller, so a row's links target that row's fields.

Two families:
- **`Flex` / `ItemList`** render an arbitrary per-row view that you supply via the `item:{view, options}` option.
- **`Grid` / `TreeGrid`** render **columns** — each cell is a view bound to the row controller.

Inherited options (`$container`, `data`, `css`, `classes`, `itemController`, `itemRelations`, …) come from View and the collection base; only view-specific options are listed below.

## Flex

`item.view.collections.Flex` — a flex container that renders each row as a copy of one per-row view.

| option | type | default | description |
|--------|------|---------|-------------|
| `item` | Item `{view, options}` | — (required) | per-row view class + its options |
| `direction` | String | `"vertical"` | flex direction (`"vertical"` / `"horizontal"`) |
| `flexWrap` | String | `"nowrap"` | CSS `flex-wrap` value |

Each row view is constructed with the row's `id` and `$container` injected; its `options.links` bind to the row controller's fields.

```javascript
new item.view.collections.Flex({
    $container: $("#list"),
    data: collection,
    direction: "horizontal",
    item: {
        view: item.view.primitives.Label,
        options: { links: { text: ".name" } }
    }
});
```

## ItemList

`item.view.collections.ItemList` — extends `Flex`, adding an "add" button below the list and a per-row delete button. (Note: this is **not** [`controls.ItemList`](controls.md#itemlist) — that control edits an Array of scalar values; this collection view renders a `controllers.Collection` of item views.)

| option | type | default | description |
|--------|------|---------|-------------|
| `item` | Item `{view, options}` | — (required) | per-row view (inherited from `Flex`) |
| `buttonText` | String | — | label for the add button |
| `confirm` | Fun | — | `(id) => Promise` gate run before a delete; deletes only if it resolves |

Clicking add calls `addItem()` (allocates a GUID and inserts a row); the per-row delete calls `removeItem(id)`, optionally behind `confirm`.

```javascript
new item.view.collections.ItemList({
    $container: $("#tags"),
    data: collection,
    buttonText: "Add tag",
    confirm: id => item.dialogs.yes_no({text: "Delete this tag?"}),
    item: {
        view: item.view.controls.TextInput,
        options: { links: { value: ".name" } }
    }
});
```

## Grid

`item.view.collections.Grid` — a tabular view; each row is a `<tr>` and each column a cell view bound to the row controller.

| option | type | default | description |
|--------|------|---------|-------------|
| `columns` | Array | — (required) | column definitions (see below) |
| `header` | Array | — | header cells, aligned to `columns`; omit for no header |
| `footer` | Array | — | footer cells, aligned to `columns` |
| `resizable` | Bool | — | draggable column resizers |
| `numerated` | Bool | — | prepend a row-index column |
| `checkbox` | Bool | — | prepend a selection-checkbox column |
| `multiselect` | Bool | `false` | allow selecting multiple rows |
| `pager` | Set | — | options for the [Pager](widgets.md) widget; omit for no pager |
| `row` | Set | — | option overrides merged into every row view (e.g. per-row `links`/`css`) |

### Events

| event | payload | when |
|-------|---------|------|
| `onSelect` | `[selectedRows]` | selection changes; argument is an array of row views |
| `rowDblClick` | `row` | a row is double-clicked |

### Column definition

`columns` is an array, one entry per column. Each entry takes one of three forms:

**1. Field-name string** — renders the field as text, bound to the row controller:

```javascript
columns: [".name", ".pattern"]
```

The string is the field accessor on the row controller. The leading `.` is the fp field-name convention (see [Gotchas](#gotchas)); a plain key like `"type"` works too.

**2. Computed cell** — `{fields:[...], handler}` derives the cell from one or more fields:

```javascript
columns: [
    {fields: ["prototype"], handler: proto => proto ? "yes" : "no"}
]
```

`handler` receives the listed field values and returns an HTML string (or jQuery markup) rendered into the cell.

**3. Full view** — `{view, options}` mounts any control/view as the cell, bound to the row controller via its `links`:

```javascript
columns: [
    {view: item.view.controls.Checkbox, options: {links: {value: ".active"}}}
]
```

### Header & footer

`header` and `footer` are arrays aligned to `columns`. Each entry is a string, number, function (`→ string`), a `{view, options}`, or a grouped header `{text, children:[...]}` that spans the listed child columns. If `numerated`/`checkbox` are set, the corresponding prepended columns are accounted for automatically.

### Selection

Rows are single-select by default. Set `multiselect:true` for multi-selection. `checkbox:true` prepends a checkbox column and `numerated:true` prepends a row-index column. The `onSelect` event delivers the current selection as an array of row views; `getSelected()` and `getRows()` return them on demand.

### Paging

Pass `pager:{}` (or pager options) to wire a [Pager](widgets.md) widget below the table; it drives the bound collection's paging. Omit `pager` for an unpaged grid.

Real example — a grid with mixed string/computed columns and conditional per-row background (from `fp/apps/fp/priv/UI/common/js/item/view/editors/fieldsEditor/fieldsEditor.js`):

```javascript
new item.view.collections.Grid({
    data: gridController,
    columns: [".name", "type", "subtype", "storage", "index", "default",
        ...fields.map(field => ({fields: [field], handler: handlers[field]}))],
    header: ["Name", "Type", "Subtype", "Storage", "Index", "Default", "Prototype", "Run-time"],
    resizable: true,
    multiselect: true,
    row: {
        links: {
            css: {source: "is_parent", handler: is_parent =>
                is_parent === true
                    ? {"background-color": "#FFFAF0"}
                    : {"background-color": ""}
            }
        }
    }
});
```

## TreeGrid

`item.view.collections.TreeGrid` — extends `Grid` with hierarchical drill-down (breadcrumbs) and a search bar. It inherits every `Grid` option and event; the **first column is the tree column** (expand button + icon prefix the cell). Drill-down and search are built in — you configure them with the functions below rather than wiring them yourself.

| option | type | default | description |
|--------|------|---------|-------------|
| `getSubitems` | Fun | — (required) | `(item[, parentOptions]) → controllers.Collection` — children of a folder |
| `isFolder` | Fun | — | `(item) → Bool` — whether a row can be expanded/drilled into |
| `itemName` | Fun | — | `(item) → String` — name shown in breadcrumbs / search results |
| `getIcon` | Fun | — | `(item) → url \| false` — row icon (falls back to folder/file icons) |
| `contextPath` | Array | `[]` | current drill path (the chain of ancestor items) |
| `search` | Fun | — | `(query[, contextPath]) → controllers.Collection` — search results |
| `getItemContext` | Fun | — | `(item) → parent item` — walks ancestors for search-result breadcrumbs |

The search bar is shown only when both `search` and `getItemContext` are supplied. `rowDblClick` fires for non-folder rows; double-clicking a folder drills into it.

Real example (from `dev/treeGrid_test.js`):

```javascript
new item.view.collections.TreeGrid({
    $container,
    data: controller,
    columns: [".name", ".pattern"],
    header: ["name", "pattern"],
    resizable: true,
    numerated: true,
    multiselect: true,
    checkbox: true,
    pager: {},
    itemName: item => item[".name"],
    isFolder: item => !item[".path"].startsWith("/root/PROJECT/LOCALIZATION/"),
    getIcon: item => false,
    getSubitems: (folder, parentOptions) =>
        new item.controllers.db.Collection({
            ...options, ...parentOptions,
            data: [".folder", "=", "$oid('" + folder[".path"] + "')"]
        }),
    search: v =>
        new item.controllers.db.Collection({...options, data: [".path", "like", v]}),
    getItemContext: item => {
        let path = item[".path"].split("/");
        path.pop();
        if (path.length <= 3) return undefined;
        const name = path[path.length - 1];
        return {".name": name, ".path": path.join("/"), ".oid": path.join("/")};
    }
});
```

Each `getSubitems` / `search` call returns a fresh [`controllers.Collection`](data-controllers.md#controllerscollection) (typically a [`db.Collection`](data-controllers.md#controllersdb) with a filter expression scoped to the folder); the TreeGrid owns and destroys these as the user navigates.

## Gotchas

- **Column field strings bind to the row controller.** A string column like `".name"` links the cell to that field on the row's forked controller, not to a parent property. The leading `.` is the fp backend field convention (see [data-controllers](data-controllers.md#controllersdb)); plain keys work for non-fp schemas.
- **`row` injects per-row links/css** — its options are merged into every row view, which is the idiomatic way to do conditional row styling. The `links.css` handler in the `fieldsEditor` example above colours parent rows by binding `css` to the row's `is_parent` field.
- **TreeGrid `columns[0]` is special** — it is wrapped as the tree cell (expand toggle + icon). Whatever form you give it (string / computed / view) is rendered inside that tree cell; the remaining columns behave like a plain `Grid`.
- **TreeGrid manages its grids dynamically** — it rebuilds the inner `Grid` on each drill/search step, so `getSelected()`, `getRows()`, `getContext()`, and `refresh()` proxy to the currently active grid.
