# Core Concepts

The reactive foundation every item.js class is built on: items, properties, change handlers, and the declarative links/events DSL. Read this first — every other reference assumes it.

## Contents
- [What item.js is](#what-itemjs-is)
- [Defining an item](#defining-an-item)
- [Reactive properties](#reactive-properties)
- [Change handlers](#change-handlers)
- [Events & binding](#events--binding)
- [The links DSL](#the-links-dsl)
- [The events DSL](#the-events-dsl)
- [Lifecycle](#lifecycle)
- [Minimal example](#minimal-example)

## What item.js is

item.js is a reactive MVC UI framework. Every class descends from `Eventful` (synchronous pub/sub) → `Linkable` (reactive properties plus the declarative *links*/*events* binding DSL) → `Item` (schema-validated options backed by a data *controller*). A *view* (`item.view.*`, a subclass of `Item`) renders jQuery markup and composes child *widgets*; views bind their properties to a *controller* (the data layer). You declare *what* binds to *what*; the framework keeps it in sync and tears it down automatically.

## Defining an item

Subclass `item.Item` (or a view base), declare config fields in `static options`, then **call `X.extend()` immediately after the class body**:

```javascript
import {item} from "../item.js";

class Counter extends item.Item {
    static options = {
        value: {type: item.types.primitives.Integer, default: 0}
    };
}
Counter.extend();
```

`extend()` deep-merges this class's `options`, `links`, and `events` with the parent's. **Omitting it breaks inheritance** — your class loses all inherited options (`id`, `links`, `events`, `data`, and, for views, `$container`, `visible`, etc.) and its own declarations never combine with the parent's. Every subclass needs its own `extend()` call.

Each entry in `static options` is an *option*: an attribute with a `type`, optional `default`, `required`, and `virtual` flags. Options **are** the reactive properties.

## Reactive properties

Read with `.get()`, write with `.set()`:

```javascript
item.get("value");            // single property (deep-copied)
item.get(["value", "label"]); // → { value, label }
item.get();                   // → all properties
item.set({value: 5, label: "x"});
```

`.set(props)` flow:
1. Unknown keys are dropped; an option set to `undefined` resets to its declared `default`.
2. `$before_<prop>` handlers run (may transform the value — see below).
3. A **diff** against current values produces a change map. **Setting an equal value is a no-op** — no events fire.
4. New values are committed, then the `change` event and per-property events fire.

Each change is a tuple `[newValue, oldValue]`.

## Change handlers

Two optional methods per property, named after the property:

`$before_<prop>(newValue)` runs **before** the diff and **must return** the (possibly transformed) value:

```javascript
$before_value(v) {
    return Math.max(0, v);   // clamp; MUST return
}
```

`$on_<prop>(newValue, oldValue)` reacts **after** the change commits (the change tuple is spread into the arguments):

```javascript
$on_value(value, previous) {
    console.log("changed", previous, "→", value);
}
```

## Events & binding

`bind(event, callback)` returns a subscription `id`; `unbind(id)` removes it:

```javascript
const id = item.bind("change", changes => {/* {prop:[new,old], ...} */});
item.unbind(id);
```

Binding to a **property name** (or array of names) instead of an event fires the callback **immediately** with the current value(s), then again on every change:

```javascript
item.bind("value", (v) => {/* called now, and on each change */});
item.bind(["page", "pageSize"], ({page, pageSize}) => {/* current values now */});
```

An empty array `[]` binds to all properties. Every item also fires a `destroy` event when torn down. Triggers are **synchronous and FIFO** — a global queue flushes in subscription order, so handlers run predictably.

## The links DSL

A *link* declaratively binds **this item's property** to a value from a *source*. Declare links in `static links` or in the `links` option:

```javascript
links: {
    targetProp: "source@event"              // string shorthand
    targetProp: {source, event, handler}    // full form
}
```

**Defaults:** the default `source` is the `data` controller; the default `event` is the source's own name. So `links: {value: "name"}` binds this item's `value` to the **`data` controller's `name` field**.

`source` is resolved against the link **context** (keys: `data`, `self`, `parent`, `widgets`) as a dotted path, or it may be a `Linkable` instance directly. Bind to a parent view's property with `{source: "parent", event: "page"}`.

`event` may be an **array** — the handler then receives an object keyed by event name: `event: ["page", "pageSize"]` → `handler({page, pageSize})`.

`handler(value, context)` transforms the incoming value before it is set; it may return a Promise (the resolved value is applied). The default handler is identity.

If the target property starts with `"!"` and names a method, the link **calls that method** instead of setting a property (an array value is spread as arguments).

```javascript
// 1. Bind own `value` to the data controller's `name` field:
static links = { value: "name" };

// 2. Enable only when the parent's page > 1:
links: {
    enable: {source: "parent", event: "page", handler: p => p > 1}
}
```

## The events DSL

An *event* binds one of **this item's events** to a target. Declare in `static events` or the `events` option:

```javascript
events: {
    click: fn                          // just a handler (callback)
    click: "target@prop"               // route to a target property
    click: {handler, target}           // both
}
```

The default target is the `data` controller, so a bare `"prop"` target means `"data@prop"`. With only a `{handler}` (or a plain function), the event is a callback that does not depend on context. The handler's return value is what gets set on the target.

## Lifecycle

Construction is synchronous, but linking is **deferred**: the constructor schedules `link(context)` via `setTimeout`, so an item is fully wired on the next tick (after its parent has had a chance to provide context). `link()` activates all links and events and connects the data controller.

`.destroy()` fires the `destroy` event and then auto-tears-down every link and event this item established — each `Link` self-destructs when either its source or target is destroyed, so cleanup is automatic.

The `data` option is a *controller instance*, not raw data — it is the shared data layer an item and its widgets read from and write to. See [data-controllers](data-controllers.md).

## Minimal example

A composite view with one `data` controller shared by two child widgets. Each widget's `value` link binds to a field on that **shared controller** (a parent view automatically injects its own `data` into each widget's options):

```javascript
import {item} from "../item.js";

class UserForm extends item.view.Item {
    static markup = `<div>
        <div name="name"></div>
        <div name="age"></div>
    </div>`;

    static widgets = {
        // value binds to data.name on the shared controller
        name: {view: item.view.controls.TextInput,   options: {links: {value: "name"}}},
        // value binds to data.age
        age:  {view: item.view.controls.NumberInput, options: {links: {value: "age"}}}
    };
}
UserForm.extend();

new UserForm({
    $container: $("body"),
    data: new item.controllers.Item({
        schema: {name: {type: item.types.primitives.String},
                 age:  {type: item.types.primitives.Integer}},
        data: {name: "Ada", age: 36}
    })
});
```

Editing either widget writes back to the shared controller; reading the controller reflects both. The View, `markup`, and widget-mounting mechanics are covered in [views-foundation](views-foundation.md).

**Gotchas:**
- A parent View injects its own `data` controller into each child widget. A widget's `links: {value: "field"}` binds to that **shared controller**, not to a parent property. To bind to a parent property, use `{source: "parent", event: "field"}`.
- Inside `static widgets = {...}` and `static options = {...}` object literals, `this` is **not** the instance. Reference other items through the link/event context keys (`parent`, `self`, `data`, `widgets`) instead.
- `$before_<prop>` must **return** the value, or the property becomes `undefined`.
