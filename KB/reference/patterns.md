# Composition Patterns

How the pieces fit together in real apps. Each pattern is a compact, idiomatic composition of the components documented elsewhere — a controller (the data layer), a view tree (markup + widgets), declarative `links`/`events`, and layout views that wire commit/rollback. Read [core-concepts](core-concepts.md), [views-foundation](views-foundation.md), [data-controllers](data-controllers.md), [collections](collections.md), and [layout](layout.md) first; this file only shows the wiring.

## Contents
- [Dynamic composition](#dynamic-composition)
  - [Override `markup()` / `widgets()`](#override-markup--widgets)
  - [Reactive links beyond `value`](#reactive-links-beyond-value)
- [Pattern 1 — Edit form bound to a controller](#pattern-1--edit-form-bound-to-a-controller)
- [Pattern 2 — Data-grid screen](#pattern-2--data-grid-screen)
- [Pattern 3 — Modal editor via FormWindow](#pattern-3--modal-editor-via-formwindow)
- [Pattern 4 — Master–detail (grid row → forked editor)](#pattern-4--masterdetail-grid-row--forked-editor)
- [Checklist](#checklist)

## Dynamic composition

Two idioms the patterns below rely on.

### Override `markup()` / `widgets()`

`static markup` / `static widgets` describe **fixed** structure. When the template or the child widgets depend on instance state — most often when each instance must build its **own controller** and pass it as a child's `data` — override the `markup()` / `widgets()` **methods** instead. The base `View` defines both as methods that simply return the statics, so the two forms are otherwise equivalent (`src/view/item.js`):

```javascript
markup(){ return this.constructor.markup; }
widgets(){ return this.constructor.widgets; }
```

The framework's own `Pager` and `Breadcrumbs` do exactly this — their `widgets()` constructs a fresh `controllers.Collection` per instance and feeds it to child widgets (`src/view/widgets/pager.js`, `src/view/widgets/breadcrumbs.js`):

```javascript
class Pager extends item.view.Item {
    widgets(){
        this._pages = new item.controllers.Collection({ id: "page", schema: {/* … */} });
        return { items: {view: PageList, options: {data: this._pages}} };
    }
}
```

Use a method override whenever a widget's `options` must reference something computed in the constructor; use the `static` forms for everything fixed.

### Reactive links beyond `value`

A `link` can drive **any** reactive property, not just a control's `value`: a child's `enable`, a Label's `text`, a Grid row's `css`, or even a schema attribute flag like `required`. Use the full link form with a `handler`, and a **multi-field** source when the result depends on several fields — either `{source:"data", event:["type","subtype"], handler:({type,subtype})=>…}` or the JSON-string shorthand `'data@["type","subtype"]'`:

```javascript
// subtype is required only when type === "list"; it enables only for list, non-parent rows
subtype: {
    links: {
        required: {source: "type", handler: type => type === "list"},
        enable:   {source: 'data@["is_parent","type"]',
                   handler: ({is_parent, type}) => !is_parent && type === "list"}
    },
    events: {value: "subtype"}
}
```

A multi-field handler receives an object keyed by field name (see the [links DSL](core-concepts.md#the-links-dsl)).

## Pattern 1 — Edit form bound to a controller

**What/when:** a record editor — a `view.Item` of labelled controls, each control reading one `data` field and writing it back. Cited: `common/js/item/view/editors/contentEditor/itemForm.js`.

Each control is wrapped in a [`layout.FormField`](layout.md#formfield) (label + control). A control **reads** its field via `links:{value:"field"}` and **writes back** via `events:{value:"field"}`. A read-only field uses a [`primitives.Label`](views-foundation.md#primitive-views) whose `links.text` runs a formatting handler — no `events`, so it never writes:

```javascript
class ItemForm extends item.view.Item {
    markup(){ return `<div><div name="pattern"></div><div name="name"></div><div name="title"></div></div>`; }
    widgets(){ return {
        pattern: {view: item.view.layout.FormField, options: {vertical: false, name: "Pattern",
            value: {view: item.view.primitives.Label,
                    options: {links: {text: {source: ".pattern", handler: v => patternName(v)}}}}}},
        name: {view: item.view.layout.FormField, options: {vertical: false, name: "Name",
            value: {view: item.view.controls.TextInput,
                    options: {links: {value: ".name"}, events: {value: ".name"}}}}},
        title: {view: item.view.layout.FormField, options: {vertical: false, name: "Title",
            value: {view: item.view.controls.TextInput,
                    options: {links: {value: "title"}, events: {value: "title"}}}}}
    }; }
}
ItemForm.extend();
```

**Key wiring**
- The parent view auto-injects its `data` controller into every widget, so all `links`/`events` target fields on that one shared controller (see [views-foundation](views-foundation.md#composing-widgets)).
- `FormField` only labels; the actual binding lives on its inner `value` control.
- `links:{value:"field"}` reads (data → control); `events:{value:"field"}` writes (control → data). A read-only field has `links.text` with **no** `events`.
- `ItemForm` itself does not commit — it is mounted inside a `Form`/`FormWindow` that owns commit/rollback (Pattern 3).

## Pattern 2 — Data-grid screen

**What/when:** a list screen — a [`collections.Grid`](collections.md#grid) over a [`db.Collection`](data-controllers.md#controllersdb), with mixed columns, a header, paging, multi-select, and conditional per-row styling. Cited: `common/js/item/view/editors/fieldsEditor/fieldsEditor.js`.

```javascript
const gridController = new item.controllers.db.Collection({
    schema: {".oid": {type: String}, ".name": {type: String},
             "type": {type: String}, "proto": {type: Bool}, "rt": {type: Bool}},
    connection: fp_dev.getConnection,
    orderBy: ".name",
    data: ["and", [[".folder", "=", "$oid('" + context + "')"],
                   [".pattern", "=", "$oid('/root/.patterns/.field')"]]],
    page: 1, pageSize: 30
});

return {view: item.view.collections.Grid, options: {
    data: gridController,
    pager: {page: 1, pageSize: 30},
    columns: [".name", "type",
        ...["proto", "rt"].map(f => ({fields: [f], handler: ({[f]: v}) => v ? "true" : "false"}))],
    header: ["Name", "Type", "Prototype", "Run-time"],
    resizable: true,
    multiselect: true,
    row: {links: {css: {source: "is_parent",
        handler: is_parent => is_parent ? {"background-color": "#FFFAF0"} : {"background-color": ""}}}}
}};
```

**Key wiring**
- `Grid.data` is a `controllers.Collection` (here a [`db.Collection`](data-controllers.md#controllersdb) with a filter expression); each row is linked to a forked per-row controller.
- A `columns` entry is a **field-name string** (text bound to the row) or a **computed cell** `{fields, handler}`. `header` is positionally aligned to `columns`.
- `pager` wires a [Pager](widgets.md) that drives the collection's paging in both directions (see [collections](collections.md#paging)).
- `row` merges options into **every** row view — the idiomatic place for per-row `links.css`, which reacts to a row field. See [data-controllers](data-controllers.md) for the controller, [collections](collections.md) for the grid.

## Pattern 3 — Modal editor via FormWindow

**What/when:** open a record in a modal editor that commits or discards on close. A function builds a [`layout.FormWindow`](layout.md#formwindow) wrapping the [Pattern 1](#pattern-1--edit-form-bound-to-a-controller) form, with async `commit`/`rollback` and a Promise that resolves when the window is destroyed. Cited: `common/js/item/view/editors/contentEditor/itemForm.js`.

```javascript
export function itemForm(options, onCommit){
    let form;
    const commit = async data => {
        try {
            let r;
            if (typeof onCommit === "function") r = await onCommit(data);
            if (r === "stop") return;          // returning early aborts — window stays open
            await data.commit();
            form?.destroy();
        } catch(e){ item.dialogs.error("unable to save: " + e.message); }
    };
    const rollback = () => form?.destroy();
    return new Promise(resolve => {
        form = new item.view.layout.FormWindow({
            data: options.data,
            view: {view: item.view.layout.Form, options: {
                view: {view: ItemForm, options},
                commit, rollback,
                events: {destroy: () => resolve()}
            }},
            links: {
                title: {source: "data", event: [".pattern", ".name"],
                        handler: i => i[".pattern"] + ": " + i[".name"]},
                icon:  {source: "data", event: ".pattern", handler: p => getType(p)?.icon}
            }
        });
    });
}
```

**Key wiring**
- `FormWindow` wraps a [`Form`](layout.md#form) around the inner editor and feeds both the shared `data` controller. (Pass a `$container` and use a plain `Form` for an inline, non-modal editor.)
- Override `commit`/`rollback` to control disposal: the async chain `await data.commit()` then `form.destroy()`; **returning before `commit()` aborts** the save and leaves the window open.
- The window `title`/`icon` are themselves `links` onto `data` fields — multi-field for the title.
- The wrapping Promise resolves on the form's `destroy` event, so callers can `await itemForm(...)`.

## Pattern 4 — Master–detail (grid row → forked editor)

**What/when:** select a grid row, fork a per-row controller, and edit it in a `FormWindow`; changes flow back to the grid on commit. Cited: `common/js/item/view/editors/fieldsEditor/fieldsEditor.js`.

```javascript
const itemController = collection.fork({
    id: selected ? selected[".oid"] : undefined,   // undefined → create a new row
    params: {
        controller: item.controllers.db.Item,
        options: {
            connection: fp_dev.getConnection,
            autoCommit: false,
            schema: {
                ".name": {type: String, required: true},
                "type":  {type: String, required: true},
                "subtype": {type: String, links: {required: {source: "type",
                            handler: type => type === "list"}}}
            }
        }
    },
    isSource: true, isConsumer: false, onCommit: "refresh"
});

new item.view.layout.FormWindow({
    data: itemController,
    view: {view: Form},
    events: {error: item.dialogs.error, destroy: () => itemController.destroy()}
});
```

The detail form's dependent `subtype` field reacts to `type` via reactive `value`/`enable` links (and `required`, above):

```javascript
subtype: {
    links: {
        value:  {source: 'data@["subtype","type"]',
                 handler: ({type, subtype}) => type !== "list" ? null : subtype},
        enable: {source: 'data@["is_parent","type"]',
                 handler: ({is_parent, type}) => !is_parent && type === "list"}
    },
    events: {value: "subtype"}
}
```

**Key wiring**
- [`collection.fork(...)`](data-controllers.md#fork----editing-one-row-as-a-child-item) spins off a child `Item` controller for one row; a missing `id` creates a new row.
- `isSource:true` writes the child's commit back into the collection; `onCommit:"refresh"` re-reads the grid afterward.
- **Destroy the forked controller** on the window's `destroy` event — the fork is owned by this editor, not the grid.
- Dependent fields (`required`, `enable`, `value`) link to **other** fields via a multi-field source — see [Reactive links beyond `value`](#reactive-links-beyond-value).

## Checklist

Building a screen with item.js:

1. **Define/choose a controller** — pick `controllers.Item` / `Collection` / `db.*`, declare its `schema` (types, `required`, `virtual`). This is your data layer. See [data-controllers](data-controllers.md).
2. **Build a view** — subclass `view.Item`; set `static markup` (named containers) and `static widgets`, or override `markup()`/`widgets()` when structure depends on instance state.
3. **Link controls** — `links:{value:"field"}` to read, `events:{value:"field"}` to write back; use full-form links with a `handler` for read-only labels, computed text, `enable`, `css`, `required`.
4. **Arrange with layout** — wrap controls in `layout.FormField`; group the editor in a `Form` (inline) or `FormWindow` (modal); use `TabStrip`/`Panel`/`Splitter` for larger screens. See [layout](layout.md).
5. **Wire actions** — set `commit`/`rollback` (override for async + disposal), route `error`/`reject` to `item.dialogs.error`, and resolve any caller Promise on `destroy`.
6. **Call `.extend()`** on every custom class, immediately after the class body — omitting it breaks inheritance.
