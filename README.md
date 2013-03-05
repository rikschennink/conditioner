JavaScript Conditioner Framework
================================

Attention
--------------------------------

This is currently a work in progress


Introduction
--------------------------------

Conditioner is a JavaScript framework to help you decouple your JavaScript UI classes from your HTML and allows you to only initialize them under on certain conditions (which is a good thing).

In short it allows you to do the following:
Load the UI Map Class the moment the supplied media query `(min-width:30em)` is met.

```html
<div data-behavior="IMap" data-conditions='{"media":"(min-width:30em)"}'>
    IMap is currently inactive
</div>
```

```javascript
// get instance of conditioner
var myConditioner = Conditioner.getInstance();

// register ui.Map Class to be used for IMap behavior reference
myConditioner.registerDependencies(
    {
        'id':'IMap',
        'uri':'ui.Map'
    }
);

// apply behavior to document
myConditioner.applyBehavior(document);
```


Why should I use this
--------------------------------

Most UI Classes should not be concerned with the conditions under which they are allowed to be active.

For instance you might have a Map Class which generates a detailed map based on the current geolocation. Maybe, because the map takes up a lot of space, on a small screen you would rather show a url to a map service instead. The moment you add all the screen size tests to the Map Class the Map Class becomes a lot less flexible.

By separating the conditions under which the Map Class becomes active you can reuse the Class under various circumstances without altering it's code.