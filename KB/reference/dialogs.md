# Dialogs

Transient overlay helpers under `item.dialogs.*`. Each one is a **function that returns a Promise**, not a class you instantiate. It builds a throwaway [Window](layout.md) (or menu), wires it up, and tears it down on close. You call the function, then `await` it or attach `.then`/`.catch`; you never hold or `.destroy()` the dialog yourself.

The five dialogs differ in how the Promise settles:

| dialog | settles |
|--------|---------|
| `error` / `notify` | resolve only, on close |
| `yes_no` | **resolve on Yes, reject on No** |
| `selectList` | resolve with selected array, reject on cancel |
| `contextMenu` | always resolves (item data, or `null` if dismissed) |

## error

`item.dialogs.error(html)` → Promise. Opens an error [Window](layout.md) (title `"ERROR!"`) showing `html` — a string or a jQuery object, rendered via [Html](views-foundation.md). The Promise **resolves when the user closes the window**.

Its idiomatic use is as a form/controller error handler — pass it straight through:

```javascript
events: {error: item.dialogs.error}
```

## notify

`item.dialogs.notify(text)` → Promise. Opens an info [Window](layout.md) showing `text` (a [Label](views-foundation.md)). **Resolves on close.** Use it for a passive "done"/"saved" acknowledgement.

## yes_no

`item.dialogs.yes_no(text)` → Promise. A **modal** confirm [Window](layout.md) (no titlebar actions) with Yes and No buttons. It **resolves on Yes and REJECTS on No** — the rejection is empty (no error value), it is just the "No" signal.

Because No rejects, drive it with `await` in a try/catch (or `.then(onYes, onNo)`):

```javascript
try {
    await item.dialogs.yes_no("Delete this record?");
    await this.remove();          // Yes branch
} catch {
    // No branch — user declined, nothing to do
}
```

## selectList

`item.dialogs.selectList(items, options)` → Promise. A modal [Form](layout.md) wrapping a [SelectList](controls.md) over `items`. `options` is merged into the SelectList control, so pass control config such as `itemValue` / `itemText` there. The Promise **resolves with the array of selected values** when the user confirms (Save), and **rejects when cancelled**.

```javascript
const chosen = await item.dialogs.selectList(users, {
    itemValue: "id",
    itemText:  "name"
});
// chosen → array of selected ids
```

Selection is multi-value: the underlying control writes an `Array`, so `chosen` is always an array even for a single pick. Wrap the call in try/catch to handle cancellation.

## contextMenu

`item.dialogs.contextMenu(items, x, y)` → Promise. Opens a context menu at viewport coordinates `(x, y)`. `items` is an array of `{caption, handler, icon?, enable?}`:

| field | type | description |
|-------|------|-------------|
| `caption` | String | menu row label |
| `handler` | Fun | called when the row is picked |
| `icon` | String | optional image URL shown left of the caption |
| `enable` | Bool | `false` greys the row out and blocks the pick (default `true`) |

When the user picks a row the menu **invokes that row's `handler` and resolves with the row's data**; if the menu is dismissed (click-away or Escape) it **resolves with `null`**. It never rejects. The menu auto-flips when it would overflow the viewport edge.

Bind it to the inherited `contextmenu` View event (see [views-foundation](views-foundation.md)), passing the mouse coordinates:

```javascript
this.bind("contextmenu", e => {
    e.preventDefault();
    item.dialogs.contextMenu([
        {caption: "Refresh", handler: () => this.refresh()},
        {caption: "Delete",  handler: () => this.remove(), enable: canDelete}
    ], e.clientX, e.clientY);
});
```

Since each row carries its own `handler` and the menu runs it for you, you usually do not need the resolved value — let the handlers do the work and ignore the Promise.

## Notes

- `error` and `notify` are **resolve-only** — they never reject, so a bare `await` is safe.
- `yes_no` **rejects on No** with no value; always pair `await` with try/catch or supply both `.then` callbacks, or an unhandled rejection fires on decline.
- `selectList` **resolves with the selected array** (always an `Array`) and **rejects on cancel**.
- `contextMenu` **always resolves** (row data or `null`) and fires the picked row's `handler` itself.
- You never construct or destroy these dialogs — they own their [Window](layout.md) lifecycle. To build a persistent modal editor instead, use [FormWindow](layout.md) directly.
