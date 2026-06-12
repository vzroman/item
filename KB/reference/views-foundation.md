# Views Foundation

The `View` base (`item.view.Item`) that every control, collection, layout, and widget is built on: how a view renders markup, composes child widgets, and shares a `data` controller. Read [core-concepts](core-concepts.md) first — a view IS an item, so reactive properties and the links/events DSL apply unchanged.

## Contents
- [What a view is](#what-a-view-is)
- [Markup & named containers](#markup--named-containers)
- [Composing widgets](#composing-widgets)
- [Standard options](#standard-options)
- [Standard events](#standard-events)
- [Lifecycle](#lifecycle)
- [The waiting lock](#the-waiting-lock)
- [Primitive views](#primitive-views)
- [The collection view base](#the-collection-view-base)
- [Defining a custom view](#defining-a-custom-view)

## What a view is

A *view* (`item.view.Item`, a subclass of `Item`) renders an HTML template into a required `$container` (a jQuery object) and exposes its rendered DOM as `this.$markup` (the jQuery root of the template). Because a view is an item, its `options` are reactive properties and the links/events DSL works exactly as in [core-concepts](core-concepts.md). Views compose child *widgets* and bind to a `data` controller (see [data-controllers](data-controllers.md)).

## Markup & named containers

`static markup` is an HTML string template. The view renders it into `$container` on construction. Child widgets mount into descendant elements that carry a `name` attribute:

```javascript
static markup = `<div>
    <div name="title"></div>
    <div name="body"></div>
</div>`;
```

Widget containers are matched by `name`, not by id or class. If the **root** element itself carries the matching `name`, the widget mounts on the root.

The instance is stored on its own element: `this.$markup.data("@item")`. Retrieve it from any jQuery element with `item.view.Item.getItem($el)`.

## Composing widgets

Declare composed widgets in `static widgets`, keyed by the container `name`:

```javascript
static widgets = {
    title: {view: item.view.controls.TextInput,   options: {links: {value: "name"}}},
    body:  {view: item.view.controls.TextInput, options: {links: {value: "comment"}}}
};
```

Each entry renders `view` into the `[name="..."]` container. Two rules drive composition:

- **The parent auto-injects its own `data` controller** into every widget's options, so all widgets share one data layer. A widget's `links: {value: "name"}` therefore binds to a field on that **shared controller** (see the minimal form in [core-concepts](core-concepts.md)), not to a parent property.
- **A parent customizes a child through the `widgets` option.** Passing `new Parent({widgets: {title: {...}}})` deep-merges the given options over the static widget definition for that id. This is the primary way to inject extra `links`, `events`, or options into a child from outside:

```javascript
new Editor({
    $container: $("body"),
    data: controller,
    widgets: {
        title: {events: {keyup: e => {/* ... */}}}   // merged onto the static title widget
    }
});
```

## Standard options

Every view inherits these from `View` (component docs do not repeat them):

| option | type | default | description |
|--------|------|---------|-------------|
| `$container` | Any | — (required) | jQuery mount point for `$markup` |
| `visible` | Bool | `true` | toggles `display` (hides via `display:none`, restores the original) |
| `enable` | Bool | — | cascades to every child widget's `enable` |
| `focus` | Bool | `false` | focuses the view, then resets itself to `false` |
| `classes` | Array | — | reactive CSS class list; classes are added/removed as it changes |
| `css` | Set | `{}` | reactive inline-style map; updates **accumulate** (set a prop to `null` to drop it) |
| `widgets` | Set | — | per-widget option overrides, deep-merged over `static widgets` |
| `waiting` | Fun | — | busy-lock callback (see [The waiting lock](#the-waiting-lock)) |

## Standard events

`click`, `dblClick`, `contextmenu`, plus the inherited `change`, per-property, and `destroy` events. `click` and `dblClick` are disambiguated by a short timer (~200 ms), so binding **both** on the same view works — a real double-click fires `dblClick`, not two `click`s.

## Lifecycle

Construction is synchronous: rendering the markup and mounting all widgets happen in the constructor. **Linking is deferred** (as for any item — see [core-concepts](core-concepts.md)). When `link(context)` runs, the view first links its own links/events, then links each widget with an **augmented context** that adds two keys:

- `parent` — this view, so a child can target `{source: "parent", event: "..."}`.
- `widgets` — the sibling map, so a child can reach a sibling via `widgets.<id>`.

Destroying a view destroys all its widgets, tears down its links/events, and removes `$markup` from the DOM.

## The waiting lock

The `waiting` option is a callback `(promise) => { ... }`. When the view is linked to a controller that has an in-flight `request` (see [data-controllers](data-controllers.md)), the view calls `waiting(promise)` with a promise that resolves once the request settles. Use it to show a spinner or disable UI during async I/O:

```javascript
new Grid({
    $container: $("#grid"),
    data: collection,
    waiting: promise => {
        spinner.show();
        promise.finally(() => spinner.hide());
    }
});
```

Multiple pending requests across linked controllers are tracked together; the lock clears only when **all** of them settle.

## Primitive views

The two simplest concrete views, under `item.view.primitives.*`:

- **`Label`** — option `text` (String); renders the text into a `<div>`.
- **`Html`** — option `html` (Any); renders raw HTML into a full-size `<div>` (100% width/height, `flex-grow:1`).

A `Label` used as a widget bound to a controller field:

```javascript
static widgets = {
    name: {view: item.view.primitives.Label, options: {links: {text: "name"}}}
};
```

## The collection view base

`item.view.Collection` (`item.view.Collection`, a subclass of `View`) is the base for data-bound lists and grids. The full components live in [collections](collections.md) — this is the extension model.

- It binds to a `controllers.Collection` passed as `data` and renders **one child view per row**, keeping the DOM in sync via the collection's `add` / `edit` / `remove` events.
- For each row it **forks a per-row child controller** (via `data.fork`) and links the row view to it. The fork is configured by two options:

| option | shape | description |
|--------|-------|-------------|
| `itemController` | `{controller, options}` | child controller class + its options |
| `itemRelations` | `{isSource, isConsumer, onCommit}` | parent↔child wiring (defaults `isConsumer:true`) |

These map directly onto `fork()`'s `params` and relation flags — see [data-controllers](data-controllers.md#fork----editing-one-row-as-a-child-item).

Subclasses **must implement `newItem(id, prevItem)`**, returning the row view to render. Helpers: `addItem(item)` (insert a new row, allocating a GUID), `removeItem(id)`, `getItem(id)`. Own events: `addItem`, `removeItem`.

```javascript
class TagList extends item.view.Collection {
    static markup = `<div class="tags"></div>`;
    newItem(id, prevItem){
        return new item.view.primitives.Label({
            $container: this.$markup,
            links: {text: "label"}
        });
    }
}
TagList.extend();
```

## Defining a custom view

Subclass `item.view.Item`, set `static markup`, declare `static options`, react to each option (via a `bind` in the constructor like `Label` does, or a `$on_<prop>` handler), and call `extend()`:

```javascript
class Badge extends item.view.Item {
    static options = { count: {type: item.types.primitives.Integer, default: 0} };
    static markup = `<span class="badge"></span>`;
    constructor(options){
        super(options);
        this.bind("count", n => this.$markup.text(n));
    }
}
Badge.extend();
```

Binding to the property name (`bind("count", ...)`) fires immediately with the current value and again on every change, so the markup is correct from the first render.

## Notes / gotchas

- Every concrete view **must** set `static markup` and call `extend()` (omitting `extend()` breaks inheritance — see [core-concepts](core-concepts.md)).
- Widget containers are matched by the `name` attribute, never by id or class.
- To pass `links`/`events` into a child widget from outside, use the parent's `widgets` option override — it is deep-merged over the static definition.
- Inside `static widgets` / `static options` literals, `this` is not the instance; reach other items through the link/event context keys (`parent`, `self`, `data`, `widgets`).
