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
<div data-module="ui/Map" data-conditions="media:{(min-width:30em)}">
    ...
</div>
```

```javascript
// load modules within document context
conditioner.loadModules(document);
```


Quick Overview
--------------------------------

### HTML attributes available for module binding
You can bind your javascript modules to your DOM using a set of data attributes.

#### data-module
The string contained in the `data-module` attribute points to the location of the module.
```html
<div data-module="ui/Map"> ... </div>
```

You can also use a shortcut name, should the module path change you will only have to change it in one location.
```javascript
conditioner.setOptions({
    'modules':{
        'ui/Map':'IMap'
    }
});
```
```html
<div data-module="IMap"> ... </div>
```

#### data-conditions
The conditions attributes allows you to control the conditions under which a module is loaded. For instance, below is an example condition which only loads the module if the supplied media query is matched or if the browser lacks media query support.
```html
<div data-module="ui/Map" data-conditions="media:{(min-width:30em)} or not media:{supported}"> ... </div>
```

#### data-options
The options attribute allows you to set specific options for the module, these options are then passed to the the module the moment it is initialized.
```html
<div data-module="ui/Map" data-options='{"zoom":10}'> ... </div>
```

It's also possible to define options at page level. ConditionerJS will automatically merge page level options with node level options before passing them to the module (node level options will take precedence before page level options).
```javascript
conditioner.setOptions({
    'modules':{
        'ui/Map':{
            'options':{
                'zoom':8 // all maps on the page now have "8" set as their zoom level
            }
        }
    }
});
```

#### data-priority
The priority attributes allows you to control the order in which a module is loaded. Positive numbers give a module priority over other modules, a negative number moves it to the back of the initialisation queue.
```html
<div data-module="ui/Map" data-priority="1"> ... </div>
```


Demo
--------------------------------
You can see it in action here http://rikschennink.github.io/conditioner/
