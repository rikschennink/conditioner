JavaScript Conditioner Framework
================================

Attention
--------------------------------

This is currently a work in progress


Introduction
--------------------------------

Conditioner is a JavaScript framework to help you decouple your JavaScript UI classes from your HTML and allows you to only initialize them under on certain conditions (which is a good thing).

### Example

In short it allows you to do the following:
Load the Clock UI Class the moment the supplied media query `(max-width:40em)` is met.

```html
<div data-behavior="IClock" data-conditions='{"media":"(max-width:40em)"}'>
    IClock is inactive
</div>
```

```javascript

// get instance of conditioner
var myConditioner = Conditioner.getInstance();

// register ui.Clock to be used for IClock behavior reference
demo.registerDependencies(
    {
        'id':'IClock',
        'uri':'ui.Clock'
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

