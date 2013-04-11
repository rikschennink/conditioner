ConditionerJS
================================

**This is currently a work in progress and very much a proof of concept**

Introduction
--------------------------------

Conditioner is a JavaScript framework build to help you decouple your JavaScript UI classes from your HTML, it allows you to control the conditions under which your JavaScript Classes are allowed to be initialized.

In short, supose you have a Google Maps Class which turns a link to Google Maps into a active Google Map. It would only make sense to activate this UI element when you've got enough real estate.

Load the UI Map module the moment the supplied media query `(min-width:30em)` is met.

```html
<div data-module="IMap" data-conditions='{"MediaQuery":"(min-width:30em)"}'>
    ...
</div>
```

```javascript
var myConditioner = Conditioner.getInstance();

// set custom module options
myConditioner.setOptions({
    'modules':{
        'ui/Map':'IMap'
    }
});

// apply behavior to document scope
myConditioner.applyBehavior(document);
```


Why should you use this?
--------------------------------

Most UI Classes should not be concerned with the conditions under which they are allowed to be active. For instance, there might be circumstances under which the Map should be active on a small screen.

If you add the media query checks to the Map class your Map Class starts to get really specific.

By separating the conditions under which the Map Class becomes active you can reuse the Class under various circumstances without altering it's code.