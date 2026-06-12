# Data Controllers

The data layer behind a view's `data` option: a controller holds committed data plus pending changes, validates against a schema, and commits or rolls back. Read [core-concepts](core-concepts.md) first — controllers are `Linkable` items, so reactive properties and the links/events DSL apply unchanged.

## Contents
- [Overview](#overview)
- [Schema](#schema)
- [controllers.Item](#controllersitem)
- [controllers.Collection](#controllerscollection)
- [controllers.db](#controllersdb)
- [Requests & the waiting lock](#requests--the-waiting-lock)
- [How forms use controllers](#how-forms-use-controllers)

## Overview

A *controller* is an instance you pass as a view's `data` option. It keeps two layers: `_data` (committed, validated values) and `_changes` (pending edits, each stored as a `[new, old]` tuple). Reads merge changes over data; writes accumulate into `_changes` until you `commit()` (apply) or `rollback()` (discard). Every read returns a **deep copy**.

Three kinds, all sharing this model:
- `item.controllers.Item` — a single record.
- `item.controllers.Collection` — a keyed set of records (rows).
- `item.controllers.db.Item` / `item.controllers.db.Collection` — the same, backed by a remote database through a connection adapter.

## Schema

Every controller requires a `schema` mapping field names to attribute declarations:

```javascript
schema: {
    name: {type: item.types.primitives.String, required: true},
    age:  {type: item.types.primitives.Integer, default: 0},
    _open:{type: item.types.primitives.Bool, virtual: true}
}
```

Per-field flags:

| flag | default | meaning |
|------|---------|---------|
| `type` | `primitives.Class` | the value type; see [types](types.md) for the list |
| `default` | `undefined` | value applied when the field is missing/`null` |
| `required` | `false` | if a required field is undefined, the **whole controller is invalid** — a no-arg `get()` returns `false` and nothing can be committed |
| `virtual` | `false` | not persisted to a backend (filtered out on commit/query); use for transient UI state |
| `options` | — | options object for the type instance |

Only fields declared in the schema are kept; unknown keys are dropped on `coerce`/`set`. Validity is detected exactly by `get()` returning `false` when a required field is missing.

## controllers.Item

A single validated record — `item.controllers.Item`.

| option | type | default | description |
|--------|------|---------|-------------|
| `schema` | object | — | field declarations (required) |
| `autoCommit` | Bool | `true` | commit automatically (async) after each `set` once committable |
| `data` | object | — | initial data; if given, `init(data)` runs in the constructor |
| `request` | — | `false` | holds the active request promise (see [requests](#requests--the-waiting-lock)) |

**Data vs. changes.** `get(field)` returns the pending value if changed, else the committed one. `get()` with no argument returns the full schema-validated object, or `false` if a required field is missing. `set(props)` records edits into `_changes`; validation and (if enabled) auto-commit are deferred to a later tick via `setTimeout`, so `autoCommit` commits **asynchronously** after the `set` call returns.

**Initialization & readiness.** `init(data)` coerces through the schema, stores it as committed `_data`, clears pending changes, and resolves readiness. A controller is not usable until initialized — `set()` is a no-op before `init`, and **binding to data fields is deferred until ready**. `onReady()` returns a promise that resolves once `_data` is set; `bind()` on a data field automatically waits for it.

**Lifecycle methods:**
- `isCommittable()` — true when initialized **and** has changes **and** is valid.
- `commit()` — apply `_changes` onto `_data`, clear changes, fire `commit`; rejects `"not ready"` if not committable. Returns a promise.
- `rollback([changes, error])` — revert pending changes (all, or a given subset).
- `refresh([data])` — replace data; no-arg refresh undoes pending changes. Override hook for backed controllers.

**Events** (own): `committable` (`isCommittable()` changed), `commit` (fires with the applied `changes`), `rollback`, `reject` (commit attempted while not committable / validation failed).

**Constructor options as properties.** Read/write a constructor option with `option(name[, value])`, or through the reactive layer with the `$.` prefix: `get("$.request")`, `set({"$.request": ...})`. An option change fires a `$.<name>` event and an optional `$on_<name>` handler.

Minimal auto-commit record:

```javascript
const user = new item.controllers.Item({
    schema: {
        name: {type: item.types.primitives.String, required: true},
        age:  {type: item.types.primitives.Integer, default: 0}
    },
    data: {name: "Ada", age: 36}
});

user.bind("commit", changes => console.log("saved", changes));
user.set({age: 37});   // committable; auto-commits on the next tick
```

## controllers.Collection

A keyed set of records — `item.controllers.Collection`. Extends `Item`; rows are keyed by the field named in `id`, and **manual commit is the default** (`autoCommit: false`).

| option | type | default | description |
|--------|------|---------|-------------|
| `id` | String | — | field whose value keys each row |
| `autoCommit` | Bool | `false` | manual commit by default |
| `filter` | array | — | in-memory row filter (array expression, see below) |
| `orderBy` | String/array | — | sort, e.g. `"name"` or `[["name","asc"],["age","desc"]]` |
| `page` | Integer | `1` | current page |
| `pageSize` | Integer | `undefined` | rows per page (`undefined` = all) |
| `totalCount` | Integer | `0` | total row count (reactive) |

**Initial data** is an array (or object map) of records; pass it through the `data` option or `init(...)`.

**Methods:**
- `get(id)` — one row; `get([id, ...])` — an object of those rows; `get()` — all rows (object keyed by id).
- `set(items)` — `{id: record}` to add/edit, `{id: null}` to remove.
- `forEach(callback)` — iterate the current page (honoring `filter`, `orderBy`, paging), called with each row id.
- `commit([ids])` — commit all pending rows, or only the listed ids.
- `rollback`, `refresh` — as in `Item`.

**Events** (own): `add` (`[id, prevId]`), `edit` (`[id, prevId]`), `remove` (`[id]`), `count` (`total`), `error`. `add`/`edit`/`remove` describe page-view changes; `prevId` is the id of the preceding visible row (insertion anchor).

### fork() — editing one row as a child Item

`fork(...)` spins off a child `Item` controller bound to a single collection row, so a row-editor form can drive that row. This is the standard wiring for "edit one item from a grid".

```javascript
const rowEditor = collection.fork({
    id: selectedId,                 // omit/undefined → new row (a GUID is allocated)
    params: {
        controller: item.controllers.Item,   // child controller class
        options: {autoCommit: false, schema: {/* row fields */}}
    },
    isSource:   true,    // child commit → writes back to the collection
    isConsumer: false,   // collection change → pushed into the child
    onCommit:   "refresh" // "refresh" | "commit" | undefined
});
```

- `isSource` (or any `onCommit`): the child's `commit` propagates the edited row into the parent. `onCommit:"refresh"` re-reads the parent afterwards; `"commit"` commits just that row; `undefined` only stages it with `parent.set`.
- `isConsumer`: parent changes to that row are pushed into the child; a parent removal destroys the child.
- The parent↔child bindings auto-unbind when either side is destroyed.

## controllers.db

`item.controllers.db.Item` and `item.controllers.db.Collection` extend the base controllers with a remote backend reached through a **connection adapter**. The `connection` is an **app-provided function** (e.g. `fp_dev.getConnection` in the fp project) — it is not part of item.js itself; it exposes `get`/`query`/`subscribe`/`create_object`/`edit_object`. Field names beginning with a dot (`.oid`, `.name`) are an fp backend convention, not item.js syntax.

Shared options (added to the base):

| option | type | default | description |
|--------|------|---------|-------------|
| `connection` | Fun | — | adapter factory (required) |
| `timeout` | Integer | `60000` | per-request timeout (ms) |
| `subscribe` | Bool | `false` | live updates — the backend pushes create/update/delete which `refresh` the controller |
| `request` | — | `true` | active request promise |

`db.Collection` adds `serverPaging` (Bool, paging done by the backend), `filter`, and `DBs` (target databases, default `"*"`), plus the inherited paging options. Because `subscribe` streams the full result set, **enabling `subscribe` disables `serverPaging`**.

**Initialization.** `db.Item.init(...)` accepts an OID string, an object carrying `.oid`, or raw data (new object). `db.Collection.init(filter)` takes a filter expression and queries the backend. The filter is an **array expression** — a `[field, operator, value]` triple, or `["and"|"or", [...subfilters]]` / `["andnot", [a, b]]`:

```javascript
const grid = new item.controllers.db.Collection({
    connection: fp_dev.getConnection,
    schema: {
        ".oid":  {type: item.types.primitives.String},
        ".name": {type: item.types.primitives.String},
        "comment":{type: item.types.primitives.String}
    },
    data: ["and", [                       // → init(filter)
        [".pattern", "=", "$oid('/root/.patterns/fp_library')"],
        [".folder",  "=", "$oid('/root/FP/global_libraries')"]
    ]],
    serverPaging: true,
    page: 1,
    pageSize: 30
});
```

`db.Collection` always keys rows by `.oid`. On `commit`, the controller talks to the backend (create/edit/delete) and then `refresh`es from the server — so **committing can clear pending changes** as fresh data arrives. Virtual fields are excluded from all backend traffic.

## Requests & the waiting lock

Backed controllers serialize their async work through `queueRequest(fn)`: it runs requests one at a time and publishes the in-flight promise on the `request` option (cleared on completion). Views that declare a `waiting` callback automatically show a busy lock while their controller's `request` is pending — see [views-foundation](views-foundation.md). Reading `get("$.request")` (or binding to the `$.request` event) lets any item observe pending I/O.

## How forms use controllers

A view shares its `data` controller with its child widgets, so a form and its controls all read and write the same record. A control's `value` link binds to a field on that controller — `links: {value: "name"}` targets `data@name` (see the links DSL in [core-concepts](core-concepts.md)). Wiring is then conventional:

- **Submit** → `controller.commit()`.
- **Cancel** → `controller.rollback()`.
- Validation failure or a not-ready commit fires `reject` (and `error`), which a form typically routes to an error dialog.

```javascript
itemController.bind("reject", item.dialogs.error);
```

## Further reading (fp/UI examples)

- `fp/apps/fp/priv/UI/common/js/item/types/PF_RESEARCH/pf_research.js` — base `Item` with a schema, `set`/`commit`.
- `fp/apps/fp/priv/UI/common/js/item/view/editors/libraryEditor/libraryEditor.js` — `db.Collection` plus `fork()` to drive a row-editor form.
- `fp/apps/fp/priv/UI/common/js/item/controllers/ts.js` — a custom `Collection` subclass overriding query/refresh via `queueRequest`.
