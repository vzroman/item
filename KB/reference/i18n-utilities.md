# i18n & Utilities

Localization (`item.i18n`) and low-level data/change helpers (`item.util`).

## Localization (item.i18n)

A tiny key→string dictionary keyed by language. Each language is a flat `{key: value}` map; the active language (default `"en"`) is global.

| function | description |
|----------|-------------|
| `text(key, language?)` | translated string for `key` in the active (or given) language; returns `key` unchanged if there's no translation, the language is unknown, or `key` isn't a string |
| `setLanguage(language)` | set the active language; an unknown language is auto-created as an empty dictionary |
| `getLanguage()` | read the active language |
| `addLanguage(language, dictionary)` | register a `{key: value}` dictionary |
| `addKey(key, value, language?)` | add one translation (defaults to active language; auto-creates the language) |
| `removeKey(key, language?)` | remove one translation |
| `removeLanguage(language)` | drop a language |

`text` is the workhorse — wrap user-facing strings with it so they follow the active language:

```javascript
item.i18n.text("Save");
```

Framework controls and dialogs already pass their own labels through `text`, so registering keys for the built-in strings localizes them too.

The built-in `en` dictionary is empty: an app registers its own keys. Minimal setup:

```javascript
item.i18n.addLanguage("de", {
    "Save":   "Speichern",
    "Cancel": "Abbrechen"
});

item.i18n.setLanguage("de");

item.i18n.text("Save");      // "Speichern"
item.i18n.text("Unmapped");  // "Unmapped"  (passed through unchanged)
```

Because missing keys pass through unchanged, you can use the source-language string as the key and only register dictionaries for the other languages.

## Utilities (item.util)

`item.util = {css, data, errors, waiting}`. `css`, `errors`, and `waiting` are internal helpers (style injection, error formatting, the global busy/spinner overlay) and you rarely touch them directly.

The one app-facing namespace is **`item.util.data`** — the structural data/change helpers the framework uses internally. They mirror the `[new, old]` change-tuple and patch model described in [core-concepts](core-concepts.md).

| function | description |
|----------|-------------|
| `GUID()` | random unique id string (e.g. an ad-hoc collection row key) |
| `deepCopy(value)` | structural deep copy |
| `deepEqual(a, b)` | deep equality |
| `deepMerge(target, source)` | deep merge; a `null` in `source` resets that key |
| `diff(source, changes)` | change map `{key: [new, old]}`, or `undefined` if nothing changed |
| `patch(data, patchMap)` | apply a change map's new values onto an object |
| `pathEval(path, context)` | resolve a dotted path against an object (the same resolution the links DSL uses) |

This namespace is rarely needed directly — most code reaches for controllers and links instead, which apply this model for you. In practice you only call `GUID()` or `deepCopy()` from app code now and then:

```javascript
const row = {id: item.util.data.GUID(), name: "new"};
const snapshot = item.util.data.deepCopy(row);
```
