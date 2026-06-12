# Types

The value validators used as a schema field's `type`. Each type knows how to coerce an arbitrary value into a valid one for that field. Read [data-controllers](data-controllers.md) first — types are declared in a controller's `schema`, and per-type configuration goes in that field's `options` object.

## Core model

Types live at `item.types.primitives.*` and `item.types.complex.*`. A type is set as a field's `type` (see [data-controllers](data-controllers.md)); its configuration goes in the same field's `options`:

```javascript
schema: {
    name:  {type: item.types.primitives.String, options: {length: 64}, required: true},
    score: {type: item.types.primitives.Float,  options: {min: 0, max: 100}},
    kind:  {type: item.types.primitives.String, options: {pattern: /^(a|b|c)$/}}
}
```

Every type implements `coerce(value)` → a valid value, or `undefined` if the value can't be coerced. Returning `undefined` is exactly how a type **rejects** a value; the schema then falls back to the field's `default`, or — if the field is `required` — marks the controller invalid. `null` always coerces to `undefined`.

Every type inherits the `coerce` **option**: a custom `(value) => value` function run BEFORE the built-in coercion, e.g. `options: {coerce: v => v.trim()}`.

## Primitives — `item.types.primitives.*`

| type | coercion rule | own options |
|------|---------------|-------------|
| `Any` | passthrough (only `null`→`undefined`) | — (base of all types; carries `coerce`) |
| `Bool` | `!!value` (null/undefined stay `undefined`) | — |
| `String` | `String(value)` | `length`, `pattern` |
| `Float` | `parseFloat`; `NaN`→`undefined` | `min`, `max` |
| `Integer` | extends `Float`, then `Math.round` | `min`, `max` |
| `Array` | value must be an Array, else `undefined` | — |
| `Set` | value must be a plain object `{}`, else `undefined` | — |
| `Fun` | value must be a function, else `undefined` | — |
| `Class` | accepts the configured class or a subclass of it | `class` |
| `Instance` | accepts a value that is `instanceof` the configured class | `class` |

Option details:

- **`String.length`** — truncate to this maximum length.
- **`String.pattern`** — a RegExp; a value that does not match coerces to `undefined`. This is the usual way to express an enum or format check.
- **`Float.min` / `Float.max`** — clamp the number into range (`Integer` inherits both).
- **`Class.class`** — a class/constructor (default is the base type). The value must be that class or a subclass of it (prototype check). Use when a field holds a **class reference** ("a type of type"), not an instance.
- **`Instance.class`** — a class/constructor; the value must be `instanceof` it, else `undefined`. Example: the controller `data` option is typed `{type: Instance, options: {class: Controller}}`.

> `Set` here is a **keyed object map**, not the JS `Set` class — easy to confuse.

## Complex types — `item.types.complex.*`

All take an `options.schema` and validate structured values against that nested schema, reusing the same Schema engine as a controller.

| type | coerces | validates |
|------|---------|-----------|
| `Item` | one object | the object against `options.schema` (a nested record field) |
| `Collection` | an Array | EACH element against `options.schema` |
| `Set` | a plain object map | EACH value against `options.schema` |

```javascript
tags: {
    type: item.types.complex.Collection,
    options: {schema: {
        id:    {type: item.types.primitives.String},
        label: {type: item.types.primitives.String}
    }}
}
```

## Notes

- A type returning `undefined` is the rejection signal; the schema's `default`/`required` logic decides what happens next (see [data-controllers](data-controllers.md)).
- `Class` vs `Instance`: `Class` matches a constructor/subclass; `Instance` matches an object created from a class.
- Custom enums and ad-hoc validation are normally done with `String` + `pattern`, or a custom `coerce` function on the field — no new type needed.

## Custom types

A type is any class with a `coerce(value)` method that extends `item.types.primitives.Any` and calls `Type.extend()` (to merge inherited options). In practice the built-ins plus the `coerce` option cover almost every need, so define a custom type only when coercion logic is genuinely reusable across many fields.
