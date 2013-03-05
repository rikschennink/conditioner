JavaScript Conditioner Framework
================================

About
--------------------------------

Conditioner is a JavaScript framework to help you decouple your JavaScript UI classes from your HTML and allow you to load initialize them on certain conditions.

### Example

In short it allows you to do the following:
Load the Clock behavior the moment the supplied media query is met.

```html
<div data-behavior="ui.Clock" data-conditions='{"media":"(max-width:40em)"}'>ui.Clock is inactive till conditions are met.</div>
```

```javascript
var myConditioner = Conditioner.getInstance();
    myConditoiner.applyBehavior(document);
```