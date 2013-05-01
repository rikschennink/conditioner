ConditionerJS
================================

**This is a work in progress, see the issues section for work to be done**

Introduction
--------------------------------

Conditioner is a JavaScript framework based on requirejs, it allows you to conditionally load your javascript modules based on certain environment requirements.

Suppose you have a Google Maps module which transforms an anchor to a full blown Google Map.

It would make sense to only activate the maps module if there's enough real estate on the screen to render a decent sized map.

An example setup using ConditionerJS:

```html
<div data-module="IMap" data-conditions="media:{(min-width:30em)}">
    ...
</div>
```

```javascript
// setup modules
conditioner.setOptions({
    'modules':{
        'ui/Map':'IMap'
    }
});

// load modules within document context
conditioner.loadModules(document);
```

You can see it in action here http://rikschennink.github.io/conditioner/