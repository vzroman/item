# Layout

Container views under `item.view.layout.*` that arrange other views. Most take their content as an inner `view:{view, options}` descriptor (`Form`, `FormField`, `Window`, `FormWindow`, `TabStrip`); `Panel` and `Splitter` instead operate on the children already mounted in their `$container`. Every view here inherits the standard options/events from `View` — see [views-foundation](views-foundation.md); only the own additions are documented below. The commit/rollback model used by `Form`/`FormWindow` is in [data-controllers](data-controllers.md).

## Contents
- [Form](#form)
- [FormField](#formfield)
- [Window](#window)
- [FormWindow](#formwindow)
- [TabStrip](#tabstrip)
- [Panel](#panel)
- [Splitter](#splitter)
- [Gotchas](#gotchas)

## Form

The standard editable-form wrapper — `item.view.layout.Form`. It mounts one inner `view`, shares its `data` controller with it, and renders Save/Cancel buttons wired to commit/rollback.

| option | type | default | description |
|--------|------|---------|-------------|
| `view` | Item `{view, options}` | — (required) | the inner control to edit; `view` is its class, `options` its config |
| `commit` | Fun | `data => data.commit()` | called on Save with the `data` controller |
| `rollback` | Fun | `data => data.rollback()` | called on Cancel with the `data` controller |

**Events:** `commit` (fires with the committed record), `cancel`, `error`.

**Content:** the inner `view` is mounted into the form body and auto-bound to the shared `data` controller (its `links`/`events` target fields on that controller). Save is **enabled only while the controller is committable** (`links:{enable:"committable"}`); Cancel is always enabled and also triggers `cancel`. The form routes the controller's `commit`/`reject`/`rollback` to its own `commit`/`error`/`cancel` events.

```javascript
new item.view.layout.Form({
    $container: $("#editor"),
    data: controller,
    view: {
        view: item.view.controls.TextInput,
        options: {links: {value: "name"}}
    },
    events: {
        commit: rec => console.log("saved", rec),
        error:  item.dialogs.error
    }
});
```

Override `commit`/`rollback` when the surrounding code needs to resolve a promise or destroy the form itself (as `item.dialogs.selectList` does — `src/dialogs/selectListDialog.js`).

## FormField

Labels a single control — `item.view.layout.FormField`. Pairs a text label with one input view.

| option | type | default | description |
|--------|------|---------|-------------|
| `name` | String | — | label text (run through i18n); the label hides when empty |
| `value` | Item `{view, options}` | — (required) | the control being labelled |
| `vertical` | Bool | `true` | `true` = label above the control, `false` = label beside it |

**Content:** `value` is the control descriptor (`{view, options}`); it is linked with the same sources as the field, so its `links` bind to the shared `data` controller.

```javascript
new item.view.layout.FormField({
    $container: $("#row"),
    data: controller,
    name: "Full name",
    value: {
        view: item.view.controls.TextInput,
        options: {links: {value: "name"}}
    }
});
```

## Window

A floating or modal window — `item.view.layout.Window`. Content is an inner `view`; the window provides a titlebar with optional maximize/minimize/close actions, dragging, and resizing.

| option | type | default | description |
|--------|------|---------|-------------|
| `view` | Item `{view, options}` | — (required) | content view |
| `title` | String | `""` | titlebar text |
| `icon` | String | — | titlebar icon (a CSS `background-image`, e.g. `url("...")`) |
| `width` / `height` | Float | — | content size in px |
| `minWidth` / `maxWidth` | Float | — | width clamps |
| `minHeight` / `maxHeight` | Float | — | height clamps |
| `position` | Item `{top, left}` | — | top-left in px; **omitted → auto-centered** and re-centered on resize |
| `modal` | Bool | `false` | renders a click-blocking overlay behind the window |
| `draggable` | Bool | `true` | drag by the titlebar |
| `resizable` | Bool | `true` | drag the edge/corner handles |
| `actions` | Array | `["maximize","minimize","close"]` | titlebar buttons to show |

`$container` defaults to `$('body')`. There is no own event set; close the window with **`.destroy()`** (the `close` action calls it). Internal reactive state (`isFocused`, `isMaximized`, `isMinimized`, `z_index`) is managed by the window itself.

```javascript
const win = new item.view.layout.Window({
    title: "Details",
    width: 600,
    height: 450,
    position: {top: 100, left: 200},
    view: {
        view: item.view.primitives.Html,
        options: {html}
    }
});
// later: win.destroy();
```

A window wrapping a `Form` is the standard modal-editor pattern (`src/dialogs/selectListDialog.js`):

```javascript
new item.view.layout.Window({
    actions: ["close"],
    minWidth: 300,
    minHeight: 100,
    view: {
        view: item.view.layout.Form,
        options: {
            view: {view: item.view.controls.SelectList, options: {items, value: []}},
            data, commit, rollback,
            events: {error: item.dialogs.error}
        }
    }
});
```

## FormWindow

Window + Form in one — `item.view.layout.FormWindow`. A modal editor: it wraps the inner `view` in a `Form` bound to `data`, then auto-closes on commit/cancel.

| option | type | default | description |
|--------|------|---------|-------------|
| `closeOnCommit` | Bool | `true` | destroy the window after a successful commit |
| `closeOnCancel` | Bool | `true` | destroy the window after cancel |

Inherits every [Window](#window) option (`title`, `modal`, `actions`, sizes, …). **Events:** `commit`, `cancel`, `error` — forwarded from the inner form, then the window destroys itself if the matching `closeOn*` is set.

**Content:** the `view` you pass is the form's **inner control**, not a Window content view — `FormWindow` builds the `Form` for you and feeds it the shared `data` controller.

```javascript
new item.view.layout.FormWindow({
    title: "Color select",
    modal: true,
    actions: ["close"],
    minWidth: 350,
    data: controller,
    view: {
        view: ColorForm,
        options: {links: {value: "value"}, events: {value: "value"}}
    },
    events: {destroy: () => controller.destroy()}
});
```

## TabStrip

A tabbed container — `item.view.layout.TabStrip`. Renders a tab menu plus the body of the active tab.

| option | type | default | description |
|--------|------|---------|-------------|
| `tabs` | Collection of tab descriptors | — | one entry per tab (schema below) |
| `active` | Integer | `0` | index of the mounted tab |
| `horizontal` | Bool | `true` | `true` = menu on top (row), `false` = menu on the side (column) |
| `disabledTabs` | Array | `[]` | indexes to disable reactively |

Each tab descriptor: `{text:String, icon?:String, disabled?:Bool, view:Class (required), options?:Set}`.

**Event:** `onChange` (fires on tab switch).

**Content:** only the **active** tab's `view` is mounted, sharing the `data` controller. Switching `active` **destroys the current tab view and builds the new one** from scratch.

```javascript
new item.view.layout.TabStrip({
    $container: $("#tabs"),
    data: controller,
    active: 0,
    tabs: [
        {text: "General",  view: GeneralForm},
        {text: "Advanced", view: AdvancedForm, options: {readonly: true}},
        {text: "Disabled", view: Placeholder, disabled: true}
    ]
});
```

## Panel

A collapsible titled container — `item.view.layout.Panel`. Clicking the title slides the body open/closed.

| option | type | default | description |
|--------|------|---------|-------------|
| `title` | String | `""` | header label (reactive) |

**Content:** the children **already present in `$container`** are moved into the panel body at construction — mount them first, then construct the panel over the same `$container`. The body starts collapsed; clicking the title toggles it (adding/removing the `open` class).

```javascript
// $container already holds the body markup
new item.view.layout.Panel({$container, title: "Some title"});
```

## Splitter

Resizable split panes — `item.view.layout.Splitter`. Wraps the existing children of `$container` in draggable panes.

| option | type | default | description |
|--------|------|---------|-------------|
| `isVertical` | Bool | `false` | `false` = side-by-side panes (vertical bars); `true` = stacked panes (horizontal bars) |
| `initSize` | Array | `[]` | initial size per pane as a percentage; index *i* sizes pane *i* |

**Event:** `onResize` (fires when a drag ends).

**Content:** operates on the children **already mounted in `$container`** — each child becomes one pane, in order, with a drag handle between adjacent panes. Mount the pane contents before constructing the splitter.

```javascript
// $container already holds three child elements
new item.view.layout.Splitter({$container, initSize: [10, 40, 50]});

// nested, stacked split inside one pane
new item.view.layout.Splitter({$container: $pane, isVertical: true, initSize: [40, 60]});
```

## Gotchas

- **Form Save** is enabled only while the controller `isCommittable()` (initialized, changed, valid) — see [data-controllers](data-controllers.md).
- **FormWindow's `view`** is the *form's inner control*, not a Window content view; `closeOnCommit`/`closeOnCancel` destroy the **whole window**, not just the form.
- **TabStrip** mounts only the active tab and rebuilds on every switch, so per-tab UI state is lost unless it lives in a shared `data` controller.
- **Panel and Splitter** consume the children already in `$container` (order matters) — mount content *before* constructing them; constructing over an empty container yields nothing.
- **Window auto-centers only when `position` is unset**; passing `position` pins it (and disables the re-centering observer).
- **Close a Window or FormWindow with `.destroy()`** — there is no `close` event; the `close` titlebar action simply calls `destroy()`.
