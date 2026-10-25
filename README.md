Atk14Js
=======

Ajax adapter for the [ATK14](https://github.com/atk14/atk14) framework.

Progressively enhances links and forms with `data-remote`, `data-method` and `data-confirm`
attributes, turning them into AJAX requests or method-spoofed form submissions, without having
to write any JavaScript by hand.

## Installation

```
npm install atk14js
```

or

```
bower install atk14js
```

Depends on jQuery >=1.12. Include `src/atk14.js` after jQuery on the page.

## Usage

### Remote links and forms

```html
<a href="/articles/1" data-remote>Load article via AJAX</a>

<form action="/articles" method="post" data-remote>
  ...
</form>
```

Clicking the link or submitting the form fires an AJAX request instead of a normal navigation.
Listen for the result on the element itself:

```js
$("a[data-remote]").on("ajax:success", function( e, data, status, xhr ) {
  // handle the response
});
```

Available events: `ajax:beforeSend`, `ajax:success`, `ajax:complete`, `ajax:error`.

### Overriding the HTTP method

```html
<a href="/articles/1" data-method="delete" data-confirm="Really delete?">Delete</a>
```

Since browsers only send GET/POST from links, `data-method` submits a hidden form instead; for
methods other than GET/POST a hidden `_method` field is added so the server can detect the
intended verb.

### Confirmation dialogs

```html
<a href="/articles/1" data-method="delete" data-confirm="Really delete?">Delete</a>
```

Before the action runs, a cancelable `confirm` event is fired on the element, followed by
`window.confirm()`. Returning `false` from a `confirm` handler aborts the action.

### Custom URL for a link

If `data-href` is present on a link, it is used instead of `href`. (Forms always use their
`action` attribute.)

### Calling it manually

```js
ATK14.handleRemote( document.getElementById( "my-link" ) );
```

### Current action

`ATK14.action` exposes the value of `<meta name="x-action">`, so client code can read the
current server-rendered action/route name.

## License

MIT
