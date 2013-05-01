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

You can see it in action here http://rikschennink.github.io/conditioner/



Quick Overview
--------------------------------

### HTML attributes available for module binding
You can bind your javascript modules to your DOM using a set of data attributes.

#### data-module
The string contained in the `data-module` attribute points to the location of the module.
```html
<div data-module="ui/Clock"> ... </div>
```

#### data-conditions
The conditions attributes allows you to control the conditions under which a module is loaded. For instance, below is an example condition which loads the module once the supplied media query is matched or the browser lacks media query support.
```html
<div data-module="ui/Clock" data-conditions="media:{(min-width:30em)} or not media:{supported}"> ... </div>
```

#### data-options
The options attribute allows you to set specific options for the module, these options are then passed to the the module the moment it is initialized.
```html
<div data-module="ui/Clock" data-options='{"time":false}'> ... </div>
```

#### data-priority
The priority attributes allows you to control the order in which a module is loaded. Positive numbers give a module priority over other modules, a negative number moves it to the back of the initialisation queue.
<div data-module="ui/Clock" data-priority="1"> ... </div>
