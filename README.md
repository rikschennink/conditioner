ConditionerJS
================================

**This is a work in progress, see the issues section for work to be done**

Introduction
--------------------------------

Conditioner is a JavaScript framework based on requirejs, it allows you to conditionally load your javascript modules based on certain environment requirements.

Supose you have a Google Maps module which transforms an anchor to a full blown Google Map. It would make sense to only activate this module when there's enough real estate on the screen to render a decent sized map. It would look something like this:

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
myConditioner.loadModules(document);
```
