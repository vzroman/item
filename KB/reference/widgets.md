# Widgets

Small composite views under `item.view.widgets.*` reused inside grids and navigation. Both inherit the standard View options/events — see [views-foundation](views-foundation.md).

## Pager

A pagination bar (`item.view.widgets.Pager`): first / prev / numbered pages / next / last buttons, a page-size dropdown, and a "from – to / total" label.

| option | type | default | description |
|--------|------|---------|-------------|
| `page` | Integer | `1` | current page |
| `totalCount` | Integer | — | total number of rows |
| `pageSize` | Integer | — | rows per page |
| `pageSizeValues` | Array | `[30, 100, 10000]` | choices in the page-size dropdown |
| `maxVisible` | Integer | `10` | max numbered page buttons shown at once |

When given a `data` controller, the Pager auto-links its `page` / `totalCount` / `pageSize` to that controller's paging **options** (`data@$.page`, `data@$.totalCount`, `data@$.pageSize`) — both as links and events. Binding it to a [`controllers.Collection`](data-controllers.md) therefore drives that collection's paging in both directions: clicking a page updates the controller, and a controller paging change moves the bar.

You rarely construct it directly. A [Grid](collections.md)'s `pager` option mounts and wires one for you:

```javascript
new item.view.collections.Grid({
    $container: $("#grid"),
    data: collection,
    pager: {}            // mounts a Pager bound to the grid's collection
});
```

Standalone, pass the collection as `data`:

```javascript
new item.view.widgets.Pager({
    $container: $("#pager"),
    data: collection,    // a controllers.Collection
    pageSizeValues: [25, 50, 100]
});
```

## Breadcrumbs

A clickable navigation path / drill-down trail (`item.view.widgets.Breadcrumbs`).

| option | type | default | description |
|--------|------|---------|-------------|
| `initPath` | Collection | `[]` | the initial trail; each crumb is `{title, callback, icon?, levelItems?}` |

Each crumb:

- `title` (String, required) — the text shown.
- `callback` (Fun, required) — invoked when the crumb is clicked.
- `icon?` (String) — optional icon.
- `levelItems?` (Array) — optional sibling crumbs (same shape) rendered as an expand dropdown, so you can jump between siblings at that level.

**Behavior:** clicking a crumb runs its `callback` and truncates the trail after it — you navigate "up". To drill "down", call `expandLevel(path)` with an array of crumbs; they are appended to the trail.

```javascript
const crumbs = new item.view.widgets.Breadcrumbs({
    $container: $("#nav"),
    initPath: [
        {title: "Root", callback: () => openFolder(null)},
        {title: "Reports", callback: () => openFolder("reports")}
    ]
});

// drill into a child level
crumbs.expandLevel([
    {title: "2026", callback: () => openFolder("reports/2026")}
]);
```

## Notes

- A Pager is usually wired through a [Grid](collections.md)'s `pager` option rather than constructed by hand; either way it reads/writes the collection's paging options.
- Breadcrumb `callback`s drive your navigation; the trail self-truncates after the clicked crumb, so each callback only needs to load that level.
- `levelItems` turns a crumb into a sibling switcher (expand dropdown); selecting a sibling activates it as the new current crumb.
