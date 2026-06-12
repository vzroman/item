# Controls

Form controls under `item.view.controls.*` — the editable widgets you bind to controller fields. Every control extends a base `Control` (`item.view.controls.Control`), which extends `View`. Read [views-foundation](views-foundation.md) and [core-concepts](core-concepts.md) first; inherited options (`$container`, `visible`, `enable`, `classes`, `css`), the `click`/`dblClick`/`contextmenu` events, and the links/events DSL are not repeated here.

## Contents
- [The value contract](#the-value-contract)
- [Buttons & text](#buttons--text)
  - [Button](#button)
  - [TextInput](#textinput)
  - [PasswordInput](#passwordinput)
  - [NumberInput](#numberinput)
- [Booleans](#booleans)
  - [Checkbox](#checkbox)
  - [Toggle](#toggle)
- [Choice lists](#choice-lists)
  - [Dropdown](#dropdown)
  - [SelectList](#selectlist)
  - [MultiSelect](#multiselect)
  - [ItemList](#itemlist)
- [Pickers](#pickers)
  - [DatePicker](#datepicker)
  - [ColorPicker](#colorpicker)
- [Choice-list data shape](#choice-list-data-shape)
- [Gotchas](#gotchas)

## The value contract

Every control (except `Button`) exposes one reactive **`value`** property. You bind it to a controller field with a link, and write user edits back with the matching event:

```javascript
{view: item.view.controls.TextInput, options: {
    links:  {value: "name"},   // controller field → control
    events: {value: "name"}    // control edit → controller field (a bare "name" means "data@name")
}}
```

Read/write in code with `.get("value")` / `.set({value})`. A control also has a convenience `value()` method: `ctrl.value()` reads, `ctrl.value(x)` sets — but in declarative code always prefer the `links`/`events` pair above.

Two options are defined on the base `Control` and available everywhere:

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | (per control) | — | the reactive value (type narrows per control) |
| `validate` | Set | — | options for the value-type's validator (see [TextInput](#textinput) / [NumberInput](#numberinput)) |

`validate` builds a type instance from the value's own type and runs `coerce()` on every incoming value; an out-of-spec value is clamped/rejected and the control flags itself invalid (adds an `invalid` CSS class). `enable: false` (inherited) disables any control.

## Buttons & text

### Button

`item.view.controls.Button` — a clickable button. No `value`; act via the inherited `click` event.

| option | type | default | description |
|--------|------|---------|-------------|
| `text` | String | — | button label |
| `title` | String | — | `title` tooltip attribute |
| `icon` | String | — | CSS `background-image`, e.g. `url("...")`; empty hides the icon box |
| `white_space` | String | `"nowrap"` | `white-space` style of the label |

```javascript
{view: item.view.controls.Button, options: {
    text: "Yes",
    events: {click: () => this._trigger("onYes")}
}}
```
(from `fp/apps/fp/priv/UI/dev/js/fp_ge.js`)

### TextInput

`item.view.controls.TextInput` — single-line text. `value` is a String, committed on `change` (blur) or Enter.

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | String | — | the text |
| `placeholder` | String | — | placeholder text |
| `length` | Integer | — | max character length |
| `validate` | Set | — | String-type rules: `{length, pattern}` (`pattern` is a regex string) |

Own event: `onInvalidInput`.

```javascript
{view: item.view.controls.TextInput, options: {
    placeholder: "myname@myserver.com",
    validate: {pattern: "^[\\w\\-\\.]+@([\\w]+\\.)+[\\w]{2,4}$"},
    links: {value: "email"}, events: {value: "email"}
}}
```
(from `fp/apps/fp/priv/UI/common/js/item/editors/rights/roles.js`)

### PasswordInput

`item.view.controls.PasswordInput` — identical to `TextInput` but renders `type="password"`. Same options and events.

### NumberInput

`item.view.controls.NumberInput` — numeric input. `value` is a Float.

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | Float | — | the number |
| `step` | Float | — | native `step`; an integer step + integer value/min restricts input to digits |
| `placeholder` | String | — | inherited from TextInput |
| `validate` | Set | — | Float-type rules: `{min, max}` (also applied as native `min`/`max` attributes) |

```javascript
{view: item.view.controls.NumberInput, options: {
    validate: {min: 1}, step: 10,
    links: {value: "memory_limit"}, events: {value: "memory_limit"}
}}
```
(from `fp/apps/fp/priv/UI/common/js/item/editors/rights/roles.js`)

## Booleans

### Checkbox

`item.view.controls.Checkbox` — a single checkbox. `value` is a Bool (an unset value renders unchecked). No own options beyond `value`.

```javascript
{view: item.view.controls.Checkbox, options: {links: {value: "active"}, events: {value: "active"}}}
```

### Toggle

`item.view.controls.Toggle` — an on/off switch. `value` is a Bool.

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | Bool | `false` | switch state |
| `textOn` | String | `"on"` | label shown in the on state |
| `textOff` | String | `"off"` | label shown in the off state |

## Choice lists

All four share the same items/mapping model — see [Choice-list data shape](#choice-list-data-shape). `Dropdown` holds a single value; `SelectList`/`MultiSelect` hold an array; `ItemList` holds an array of sub-control values.

### Dropdown

`item.view.controls.Dropdown` — a single-select `<select>`. `value` is a String.

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | String | — | the selected item's value |
| `items` | Any | — | array of values/objects, or a live `controllers.Collection` |
| `itemValue` | Any | `"value"` | field name (string) or `(item) => value` function |
| `itemText` | Any | = `itemValue` | field name or `(item) => text` function |
| `itemGroup` | Any | — | field name / function for `<optgroup>` grouping |
| `size` | Integer | — | native `size` (rows shown) |
| `hideClear` | Bool | `false` | hides the `x` clear affordance |

```javascript
{view: item.view.controls.Dropdown, options: {
    hideClear: true,
    items: [300, 600, 1200, 2400, 9600, 115200],   // primitives → {value: x}
    links: {value: "speed"}, events: {value: "speed"}
}}
```
(from `fp/apps/fp/priv/UI/common/js/item/view/controls/serial.js`)

### SelectList

`item.view.controls.SelectList` — a flat checkbox list (extends `Dropdown`). `value` is an Array.

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | Array | — | selected values |
| `multiselect` | Bool | `true` | when `false`, selecting one clears the rest |

Plus the inherited `items` / `itemValue` / `itemText` / `itemGroup` mapping options.

### MultiSelect

`item.view.controls.MultiSelect` — a chips field with a dropdown of checkboxes. `value` is an Array; selected items render as removable chips.

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | Array | `[]` | selected values |
| `items` | Any | — | array of values/objects, or a `controllers.Collection` |
| `itemValue` | String | `"value"` | field name **only** (no function) |
| `itemText` | Any | = `itemValue` | field name or function |
| `itemGroup` | Any | — | grouping field / function |
| `size` | Integer | — | rows shown |
| `isExpanded` | Bool | `false` | whether the dropdown panel is open |

```javascript
{view: item.view.controls.MultiSelect, options: {
    items: userGroupsController,   // a controllers.Collection
    itemText: ".name", itemValue: ".path",
    links: {value: "usergroups"}, events: {value: "usergroups"}
}}
```
(from `fp/apps/fp/priv/UI/common/js/item/editors/rights/roles.js`)

### ItemList

`item.view.controls.ItemList` — an editable, reorderable list of sub-controls (one per array element, with up/down/delete buttons and a trailing empty row to append). `value` is an Array; each element is edited by an instance of the control named in `item`.

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | Array | `[]` | the list of element values |
| `item` | Item | — (required) | `{view, options}` describing the per-row control (`view` must extend `Control`) |

The per-row control's `value` is wired to its row automatically — declare only its other options.

```javascript
{view: item.view.controls.ItemList, options: {
    links: {value: "value"}, events: {value: "value"},
    item: {view: Variable, options: {}}   // Variable extends Control
}}
```
(from `fp/apps/fp/priv/UI/common/js/item/view/controls/eventScript.js`)

## Pickers

### DatePicker

`item.view.controls.DatePicker` (from `controls/datetime.js`; backed by flatpickr). `value` is a timestamp in **milliseconds**, or an array of two timestamps in `range` mode. In time-only mode (`noCalendar` + `timepicker`) `value` is an `"H:i"` string.

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | Any | `new Date()` | ms timestamp, `[from, to]` for range, or `"H:i"` time string |
| `format` | String | `"d.m.Y H:i:S"` | flatpickr display format |
| `timepicker` | Bool | `true` | enable time selection |
| `noCalendar` | Bool | `false` | hide the calendar (time-only when combined with `timepicker`) |
| `range` | Bool | `false` | select a `[from, to]` range |
| `enableSeconds` | Bool | `true` | show the seconds field |
| `min` / `max` | Integer | — | selectable date bounds (ms) |
| `minTime` / `maxTime` | String | — | time bounds (live-updatable) |
| `interval` | Integer | `1` | minute increment |
| `placeholder` | String | — | input placeholder |
| `disabled` | Bool | — | disables the input |
| `localization` | String | `"loc_kz"` | flatpickr locale key (falls back to `loc_en` if unknown) |

```javascript
{view: item.view.controls.DatePicker, options: {
    format: "d.m.Y", timepicker: false,
    links: {value: "deadline"}, events: {value: "deadline"}
}}
```

### ColorPicker

`item.view.controls.ColorPicker` — a swatch button that opens a color-select modal. `value` is a hex String (e.g. `"#000"`) or `"transparent"`.

| option | type | default | description |
|--------|------|---------|-------------|
| `value` | String | `"#000"` | selected color, hex or `"transparent"` |

Own event: `onChange`.

## Choice-list data shape

`Dropdown`, `SelectList`, and `MultiSelect` build their options from `items` plus the `itemValue`/`itemText` mapping. `items` accepts:

- **An array of primitives** — each is auto-wrapped to `{value: x}`, so the default `itemValue: "value"` maps it. Good for fixed lists (e.g. baud rates).
- **An array of objects** — `itemValue`/`itemText` pick the value and label from each object.
- **A live `controllers.Collection`** — the control waits for `onReady()` and re-renders on the collection's `change` events, so options stay in sync with the data layer.

`itemValue` / `itemText` are each either:
- a **field-name string** — a literal property name on the item, e.g. `".path"` or `".name"`. The leading `.` is just an fp field-name convention, **not** a deep path.
- a **function** `(item) => ...` — computes the value/text. (Exception: `MultiSelect.itemValue` must be a string.)

`itemText` defaults to whatever `itemValue` is, so a list of `{value, text}` objects needs only `itemText: "text"`.

Value cardinality:
- **Dropdown** — single String value.
- **SelectList / MultiSelect** — Array of selected values.
- **ItemList** — Array where each element is an arbitrary value edited by a nested `Control` (not drawn from an `items` list).

## Gotchas

- **`value` write-back is not automatic.** `links:{value:"field"}` only flows controller → control. Add `events:{value:"field"}` to persist user edits back.
- **Choice-list field names are literal, not deep paths.** `itemValue: ".path"` reads `item[".path"]` — the leading dot is an fp naming convention, not a property traversal.
- **`MultiSelect.itemValue` must be a string field name** — a function is not supported there (unlike `Dropdown`/`SelectList`).
- **DatePicker value is milliseconds, not seconds**, and an array in `range` mode.
- **ColorPicker accepts `"transparent"`** as a value alongside hex strings.
- **ItemList's per-row `view` must extend `Control`** and its `value` link is injected for you — don't bind the row's `value` yourself.
