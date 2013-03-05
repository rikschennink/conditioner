JavaScript Conditioner Framework
================================

About
--------------------------------

Conditioner is a JavaScript framework to help you decouple your JavaScript UI classes from your HTML and allows you to only initialize them under on certain conditions (which is a good thing).

### Example

In short it allows you to do the following:
Load the Clock behavior the moment the supplied media query is met.

```html
<div data-behavior="ui.Clock" data-conditions='{"media":"(max-width:40em)"}'>
    ui.Clock is inactive
</div>
```

```javascript
var myConditioner = Conditioner.getInstance();
    myConditoiner.applyBehavior(document);
```


Why
--------------------------------

Most UI Classes should not be concerned with the conditions under which they are allowed to be active.

For instance you might have a Map Class which generates a detailed map based on the current geolocation. Maybe, because the map takes up a lot of space, on a small screen you would rather show a url to a map service instead. The moment you add all the screen size tests to the Map Class the Map Class becomes a lot less flexible.

By separating the conditions under which the Map Class becomes active you can reuse the Class under various circumstances without altering it's code.


About
--------------------------------