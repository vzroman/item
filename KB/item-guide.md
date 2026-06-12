# item.js — Developer Guide

A knowledge base for building **item.js** applications. item.js is a reactive MVC UI framework (vanilla ES modules + jQuery, bundled with webpack). This file is the entry point: read it first, then open the one reference file you need.

## Mental model

Everything is an **item** — an object with reactive, schema-typed *properties* and a declarative binding system. Three layers stack up:

```
Eventful   → synchronous pub/sub
Linkable   → reactive properties (.get/.set) + the links/events binding DSL
Item       → schema-validated options, backed by a data Controller
View        (item.view.*) → renders jQuery markup, composes child widgets
```

An app is a tree of **views** bound to **controllers** (the data layer). You wire them declaratively:
- **links** pull a value from a source into a property: `links: {value: "name"}`.
- **events** push a property/event out to a target: `events: {value: "name"}`.
- A view shares its `data` controller with its child **widgets**, so a form and its controls all read/write one record.

## Read this when…

Start with **core-concepts**; it underpins every other file. Then jump to the component you need.

| Read | When you need to |
|------|------------------|
| [reference/core-concepts.md](reference/core-concepts.md) | **Read first.** Items, reactive properties, `.get`/`.set`, change handlers, the links & events DSL, lifecycle, `extend()`. |
| [reference/data-controllers.md](reference/data-controllers.md) | Model data: schema, validation, commit/rollback, `controllers.Item` / `Collection` / `db.*`, `fork()`, the waiting lock. |
| [reference/types.md](reference/types.md) | Pick a field `type` and its options (String/Integer/Bool/… and complex Item/Collection/Set). |
| [reference/views-foundation.md](reference/views-foundation.md) | Build a custom view: `markup`, named containers, composing `widgets`, standard options/events, the collection view base. |
| [reference/controls.md](reference/controls.md) | Use form controls: Button, TextInput, NumberInput, Checkbox, Toggle, Dropdown, MultiSelect, DatePicker, ColorPicker, ItemList… |
| [reference/collections.md](reference/collections.md) | Render lists/tables: `Grid` (columns!), `TreeGrid`, `Flex`, `ItemList`. |
| [reference/layout.md](reference/layout.md) | Arrange UI: `Form`, `FormField`, `Window`, `FormWindow`, `TabStrip`, `Panel`, `Splitter`. |
| [reference/widgets.md](reference/widgets.md) | Add a `Pager` or `Breadcrumbs`. |
| [reference/dialogs.md](reference/dialogs.md) | Show `error`/`notify`/`yes_no`/`selectList`/`contextMenu` (Promise-returning helpers). |
| [reference/i18n-utilities.md](reference/i18n-utilities.md) | Translate strings (`item.i18n.text`) or use `item.util` helpers. |
| [reference/patterns.md](reference/patterns.md) | **Compose a screen.** Real end-to-end patterns: edit form, data grid, modal editor, master–detail. |

## Minimal example

A view with a shared data controller and two controls bound to its fields:

```javascript
import {item} from "../item.js";   // the bundled framework

class UserForm extends item.view.Item {
    static markup = `<div>
        <div name="name"></div>
        <div name="age"></div>
    </div>`;

    static widgets = {
        // a widget's `value` link binds to the SHARED data controller's field
        name: {view: item.view.controls.TextInput,
               options: {links: {value: "name"}, events: {value: "name"}}},
        age:  {view: item.view.controls.NumberInput,
               options: {links: {value: "age"}, events: {value: "age"}}}
    };
}
UserForm.extend();   // mandatory — merges inherited options/links/events

new UserForm({
    $container: $("body"),
    data: new item.controllers.Item({
        schema: {name: {type: item.types.primitives.String},
                 age:  {type: item.types.primitives.Integer}},
        data: {name: "Ada", age: 36}
    })
});
```

## Conventions that bite

These trip up newcomers — internalize them before writing code:

- **Always call `Class.extend()`** right after each class. Omitting it discards inherited options/links/events.
- **`links` is one-way (source → property).** For a control to write user edits back to the controller, add the matching **`events`** entry: `links:{value:"f"}` reads, `events:{value:"f"}` writes.
- **A bare source/target means the `data` controller.** `links:{value:"name"}` ≡ source `data@name`. To reach a parent property use `{source:"parent", event:"..."}`; siblings via the `widgets` context.
- **`this` is not the instance inside `static widgets`/`static options` literals.** Reach other items through the link/event context keys (`data`, `self`, `parent`, `widgets`). When composition needs instance state (e.g. a per-instance controller), override the `widgets()`/`markup()` *methods* instead — see [patterns.md](reference/patterns.md).
- **`$container` is a jQuery object**, required by every view.
- **Linking is deferred** to the next tick; `.destroy()` tears down a view, its widgets, and all its links automatically.

## Public API namespace

```
item.Item                                   base reactive item
item.types.primitives.{Any,Bool,Float,Integer,String,Set,Array,Fun,Class,Instance}
item.types.complex.{Item,Collection,Set}
item.controllers.{Item,Collection,db.{Item,Collection}}
item.view.Item                              base view
item.view.primitives.{Label,Html}
item.view.controls.{Button,TextInput,PasswordInput,NumberInput,Checkbox,Toggle,
                     Dropdown,SelectList,MultiSelect,ItemList,DatePicker,ColorPicker}
item.view.collections.{Flex,ItemList,Grid,TreeGrid}
item.view.layout.{Form,FormField,Window,FormWindow,TabStrip,Panel,Splitter}
item.view.widgets.{Pager,Breadcrumbs}
item.dialogs.{error,notify,yes_no,selectList,contextMenu}
item.i18n        item.util
```
