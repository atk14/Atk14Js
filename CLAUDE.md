# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Atk14Js is the Ajax adapter for the [ATK14 PHP framework](https://github.com/atk14/atk14). It is a single jQuery
plugin file (`src/atk14.js`) that progressively enhances links and forms with `data-remote`, `data-method`, and
`data-confirm` attributes, turning them into AJAX requests or method-spoofed form submissions. There is no build
step: `src/atk14.js` is both the source and the distributed file (referenced directly as `main` in `package.json`
and `bower.json`).

Published via both npm (`atk14js`) and Bower.

## Commands

There is no build, lint, or test tooling wired up (no `scripts` in `package.json`, no test files/framework present).
`.jshintrc` and `.jscsrc` exist but are not invoked by any npm script — run them manually if checking style:

```
npx jshint src/atk14.js
npx jscs src/atk14.js
```

Releasing a new version is a manual process of editing `version` in both `package.json` and `bower.json`, adding an
entry to `CHANGELOG.md`, and tagging a commit ("Version X.Y.Z") — see git history for the pattern.

## Architecture

Everything lives in `src/atk14.js` as a single IIFE assigned to the global `ATK14`. Key pieces:

- **Event delegation on `document`** wires up behavior for any matching element present now or added later:
  - `a[data-remote]`, `a[data-method]`, `a[data-confirm]` clicks
  - `form[data-remote]` submits
  - `button[type="submit"][name]` clicks inside `form[data-remote]` (captures the button's `name`/`value` as an
    extra param before the form's own submit handler fires)
- **`data-confirm`** (`allowAction`) fires a cancelable `confirm` event on the element, then falls back to
  `window.confirm()`; returning `false` from a `confirm` handler (or declining the native dialog) blocks the action.
- **`data-method` on plain links** (`handleMethod`) builds and submits a hidden `<form>` to simulate non-GET
  HTTP verbs from a link. For methods other than GET/POST it adds a hidden `_method` field (Rails-style verb
  override) and lets the browser POST it.
- **`ATK14.handleRemote(element, extraParams)`** is the public AJAX entry point, used both by the delegated
  handlers and callable directly. It accepts a form or a link (DOM element or jQuery object):
  - For forms: uses `FormData` when `POST` (so file uploads work), otherwise falls back to
    `$element.serializeArray()`.
  - For links: reads the URL from `data-href` if present, else `href`.
  - GET requests get `__xhr_request=1` appended to the query string so server-side code can distinguish
    AJAX GETs.
  - Dispatches cancelable events on the triggering element: `ajax:beforeSend`, `ajax:success`, `ajax:complete`,
    `ajax:error` — this is the integration surface for consuming code.
- **`conscript` dataType**: a custom `$.ajaxSetup` converter (`"text conscript": true`) is registered globally,
  and `handleRemote` responses of this dataType are passed to `eval()`. This is how the ATK14 PHP backend returns
  executable JS as an AJAX response (e.g., to run arbitrary page updates) — treat it as a deliberate, trusted-backend
  feature, not something to "fix" by removing the `eval`.
- **Loading state**: `document.body` gets a `loading` class toggled via jQuery's global `ajaxStart`/`ajaxStop`
  hooks, for any AJAX request on the page (not just ATK14-initiated ones).
- **`ATK14.action`**: read once at load time from `<meta name="x-action">`, exposing the current server-rendered
  action/route name to client code.

Because the whole module is one IIFE closure, "private" helpers (`fire`, `allowAction`, `handleMethod`) are not
exported — only `ATK14.action` and `ATK14.handleRemote` are public.
