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





Quick Overview
--------------------------------

### HTML attributes available for module binding

#### data-module
The string contained in the `data-module` attribute points to the location of the module. For the `IClock` below this would be `ui/Map`, you can also just use the path.
```html
<div data-module="IClock"> ... </div>
```

#### data-conditions
The conditions attributes allows you to control the conditions under which a module is loaded. For instance, below is an example condition which loads the module once the window is at least 450 pixels wide.
```html
<div data-module="IClock" data-conditions="media:{(min-width:30em)}"> ... </div>
```

#### data-options
The options attribute allows you to set specific options for the module, these options are then passed to the constructor the moment the module is initialized.
```html
<div data-module="IClock" data-options='{"time":false}'> ... </div>
```

#### data-priority
The priority attributes allows you to control the order in which a module is loaded. Positive numbers give a module priority over other modules, a negative number moves it to the back of the initialisation queue.
<div data-module="IClock" data-priority="1"> ... </div>
