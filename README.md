Conditioner
================================

**This is a work in progress, I'm still working on documentation and there's a work to be done list to be found in the issues section.**

Introduction
--------------------------------

Conditioner is a JavaScript framework based on [requirejs](http://requirejs.org), it allows you to conditionally load your javascript modules based on certain environment requirements.

Suppose you have a Google Maps module which transforms an anchor to a full blown Google Map. It would make sense to only activate the maps module if there's enough real estate on the screen to render a decent sized map.

To setup the Google Map above using Conditioner you would write the following HTML. Binding the map module using the `data-module` attribute and setting the required conditions using `data-conditions`.

```html
<a href="http://maps.google.com/?ll=51.741,3.822" data-module="ui/Map" data-conditions="media:{(min-width:30em)}">
    // ...
</a>
```

Now the HTML is setup, we only have to tell the Conditioner to look for modules in a certain section of the DOM and we're done. We can do this using the `loadModules` method.
```javascript
conditioner.loadModules(document);
```


Requirements
--------------------------------
Conditoiner currently relies on the availability of requirejs. It does not require jQuery or any other JavaScript library.

* RequireJS
* Support for IE8 and up


License
--------------------------------
[MIT](http://www.opensource.org/licenses/mit-license.php)


Demo
--------------------------------
You can see the framework in action at [the Conditioner demo page](http://rikschennink.github.io/conditioner/)


HTML Attributes
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
The `data-conditions` attributes allows you to control the conditions under which a module is loaded. For instance, below is an example condition which only loads the module if the supplied media query is matched or if the browser lacks media query support.

```html
<div data-module="ui/Map" data-conditions="media:{(min-width:30em)} or not media:{supported}"> ... </div>
```

Tests within these conditions are formatted like this: `<test_name>:{<expected_value>}` 

* Use multiple tests together with the `and` or `or` operators. 

* Use brackets to override operator precedence: `foo:{bar} or (foo:{bar} and foo:{bar})`. 

* Use the `not` operator to negate a test: `not (foo:{bar} and foo:{bar})` or `not foo:{bar}`.


#### data-options
The `data-options` attribute allows you to set specific options for the module, these options are then passed to the the module the moment it is initialized.

```html
<div data-module="ui/Map" data-options='{"zoom":10}'> ... </div>
```

It's also possible to define options at page level. Conditioner will automatically merge page level options with node level options before passing them to the module (node level options will take precedence over page level options).

```javascript
conditioner.setOptions({
    'modules':{
        'ui/Map':{
            'options':{
                'zoom':5
            }
        }
    }
});
```

#### data-priority
The `data-priority` attributes allows you to control the order in which a node is handled. Positive numbers give a node priority over other nodes, a negative number moves it to the back of the initialisation queue.
```html
<div data-module="ui/Map" data-priority="1"> ... </div>
```



JavaScript API
--------------------------------

### Conditioner

#### .setOptions
Allows customizing the conditioner inner workings.
```javascript
conditioner.setOptions({
    ...
});
```

#### .loadModules
Finds and loads all **Modules** defined on child elements of the supplied context. Returns an array of found **Nodes**.
```javascript
conditioner.loadModules(context);
```

#### .getNode
Returns a single **Node** or multiple **Node** objects matching the supplied selector.
```javascript
conditioner.getNode(selector);
conditioner.getNodesAll(selector);
```

### Node

#### .getActiveModuleController
Returns a reference to the currently active **ModuleController**.
```javascript
node.getActiveModuleController();
```

#### .getModuleControllerByPath
Getting a single or multiple **ModuleControllers** by their path.

```javascript
node.getModuleControllerByPath(path);
node.getModuleControllerAllByPath(path);
```

#### .matchesSelector
Tests if the element contained in the **Node** object matches the supplied CSS selector.
```javascript
node.matchesSelector(selector);
```

#### .execute
Safely tries to executes a method on the currently active **Module**. Always returns an object containing a status code and a response data property.
```javascript
node.execute(method,[params]);
```

### ModuleController
The **ModuleController** propagates loads and unloads the contained **Module** based on the conditions set. It propagates events from the contained **Module** so you can safely subscribe to them.

#### .matchesPath
Tests if the **ModuleController** is in charge of a module with the given path.
```javascript
moduleController.matchesPath(path);
```

#### .isActive
Tests if the module contained within the **ModuleController** is currently loaded.
```javascript
moduleController.isActive();
```

#### .load
Loads the **Module** if it's available. Publishes the 'load' event once finished.
```javascript
moduleController.load();
```

### .unload
Unloads the **Module** if it's not already unloaded. Publishes the 'unload' event once done.
```javascript
moduleController.unload();
```

#### .execute
Safely tries to execute a method on the module contained within the **ModuleController**.
```javascript
moduleController.execute(method,[params]);
```
