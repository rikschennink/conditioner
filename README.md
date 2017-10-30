# Conditioner

Declaratively link JavaScript modules to your elements and mount them based on contextual parameters like viewport size and element visibilty.



## Features

- Progressive Enhancement!
- Declarative way to bind logic to elements, [why this is good](http://rikschennink.nl/thoughts/binding-behavior-you-are-doing-it-wrong/)
- Perfectly fits with Responsive Design
- Dynamic import support
- No dependencies and small footprint (~1KB gzipped)
- Extend with plugins



## Example

Mount a `SectionToggler` module, but only do it on narrow viewports.

```html
<h2 data-module="/ui/SectionToggler.js"
    data-context="@media (max-width:30em)"> ... </h2>
```

Conditioner will unmount the `SectionToggler` when the context is no longer fitting. So when the user resizes or rotates the viewport and suddenly it's wider than `30em` the `SectionToggler` will be unmounted.



## Installation

Install with npm:

```bash
npm i conditioner-core --save
```

Using a CDN:

```html
<script src="https://unpkg.com/conditioner-core"></script>
```



## Setup

Using Conditioner in an ES6 module:

```js
import * as conditioner from 'conditioner-core';

// mount all modules on the page
conditioner.hydrate( document.documentElement );
```

Using Conditioner with dynamic imports:

```js
import('conditioner-core-es6.js').then(conditioner => {
    
    // mount all modules on the page
    conditioner.hydrate( document.documentElement );
    
});
```

Using Conditioner in an AMD module:

```js
require(['conditioner'], function(conditioner) {

    // mount all modules on the page
    conditioner.hydrate( document.documentElement );

});
```

Using Conditioner on the global scope:

```html
<script src="conditioner-core.js"></script>
<script>
    
    // mount all modules on the page
    conditioner.hydrate( document.documentElement );
    
</script>
```

A collection of boilerplates to get you started with various project setups:

- [Dynamic Imports](https://github.com/rikschennink/conditioner-boilerplate-dynamic-imports)
- [Webpack 2](https://github.com/rikschennink/conditioner-boilerplate-webpack)
- [RequireJS](https://github.com/rikschennink/conditioner-boilerplate-requirejs)
- [Global](https://github.com/rikschennink/conditioner-boilerplate-global)



## API

### Public Methods

Inspired by React and Babel, Conditioner has a tiny but extensible API.

Method                      | Description
----------------------------|---------------
`hydrate(element)`          | Mount modules found in the subtree of the passed element, returns an array of bound module objects.
`addPlugin(plugin)`         | Add a plugin to Conditioner to extend its core functionality.



### Bound Module

Bound modules are returned by the `hydrate` method. Each bound module object wraps a module. It exposes a set of properties, methods and callbacks to interact with the module and its element.

Property / Method                              | Description
-----------------------------------------------|---------------
`alias`                                        | Name found in `dataset.module`.
`name`                                         | Module path after name has been passed through `moduleSetName`.
`element`                                      | The element the module is bound to.
`mount()`                                      | Method to manually mount the module.
`unmount()`                                    | Method to manually unmount the module.
`onmount(boundModule)`                         | Callback that runs when the module has been mounted. Scoped to element.
`onmounterror(error, boundModule)`             | Callback that runs when an error occurs during the mount process. Scoped to element.
`onunmount(boundModule)`                       | Callback that runs when the module has been unmounted. Scoped to element.


### Plugins

Adding a plugin can be done with the `addPlugin` method, the method expects a plugin definition object.

Plugins can be used to override internal methods or add custom monitors to Conditioner.

You can link your plugin to the following hooks:

Hook                                           | Description
-----------------------------------------------|---------------
`moduleSelector(context)`                      | Selects all elements with modules within the given context and returns a `NodeList`.
`moduleGetContext(element)`                    | Returns context requirements for the module. By default returns the `element.dataset.context` attribute.
`moduleImport(name)`                           | Imports the module with the given name, should return a `Promise`.
`moduleGetConstructor(module)`                 | Gets the constructor method from the module object, by default expects it to be defined on `module.default` or a default export.
`moduleGetDestructor(moduleExports)`           | Gets the destructor method from the module constructor return value, by default expects a single function.
`moduleSetConstructorArguments(name, element)` | Use to alter the arguments supplied to the module constructor, expects an `array` as return value.
`moduleGetName(element)`                       | Called to get the name of the module, by default retrieves the `element.dataset.module` value.
`moduleSetName(name)`                          | Called when the module name has been retrieved just before setting it.
`moduleWillMount(boundModule)`                 | Called before the module is mounted.
`moduleDidMount(boundModule)`                  | Called after the module is mounted.
`moduleWillUnmount(boundModule)`               | Called before the module is unmounted.
`moduleDidUnmount(boundModule)`                | Called after the module is unmounted.
`moduleDidCatch(error, boundModule)`           | Called when module import throws an error.
`monitor`                                      | A collection of registered monitors. See monitor setup instructions below.


Let's setup a basic plugin. 

Instead of writing each module with extension we want to leave out the extension and add it automatically. 

We'll use the `moduleSetName` hook to achieve this:

```js
conditioner.addPlugin({
    moduleSetName: name => name + '.js'
});
```

Next up is a plugin that adds a `visible` monitor using the `IntersectionObserver` API. Each monitor can be used in a context query by prefixing the name with an `@`. Monitor plugins should mimic the [`MediaQueryList` API](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList). For Conditioner this means that each monitor should expose a `matches` property and an `addListener` method.

```js
conditioner.addPlugin({
    
    // we setup a monitor plugin
    monitor: {
        name: 'visible',
        create:(context, element) => { 

            // setup our api
            const api = {
                matches: false,
                addListener (change) {
                    
                    new IntersectionObserver(entries => {
                        api.matches = entries.pop().isIntersecting == (context === 'true');
                        change(api.matches);
                    }).observe(element);

                }
            };

            // done!
            return api;
        }
    }

});
```

Now we can use our new `visible` monitor like this:

```html
<div data-module="/ui/SectionToggle.js" data-context="@visible true"></div>
```

We can combine it with the `media` monitor by adding an `and` statement.

```html
<div data-module="/ui/SectionToggle.js" data-context="@media (max-width:30em) and @visible true"></div>
```





## Version History

### 2.0.0

* Total rewrite of Conditioner, resulting in an ES6 codebase and a smaller and more plugin oriented API.


### 1.2.3

* Replaced `this` with `window` to fix Browserify root problems


### 1.2.0

* Fixed [unload handler not called](https://github.com/rikschennink/conditioner/issues/91)
* Renamed `.on` method to `addConditionMonitor` and `.is` method to `matchesCondition`
* Added `.removeConditionMonitor`
* Fixed problem where `.is`/`matchesCondition` method did not clean up Promise
* Removed global and multiline flags from quick regex test [issue 94](https://github.com/rikschennink/conditioner/issues/94)


### 1.1.0

* The `supported` property has been added which is used to determine if a module can be loaded at all
* Improved `getModule` method API
* Constructor now set when extending a module
* Performance optimisations


### 1.0.1

* Fixed [memory leaks](https://github.com/rikschennink/conditioner/issues/71)


### 1.0.0

* Bind multiple modules to the same DOM node.
* New `was` statement to make tests sticky `element:{was visible}`.
* Alternative more human readable option format `data-options=“map.zoom:10, map.type:terrain”`.
* Support for other AMD loaders, if you follow AMD specs you should be fine.
* Browserify support, for conditional loading you'll still need an AMD loader though. 
* Separate loading state attribute for binding CSS loading animations.
* Configure the paths and attributes Conditioner uses.
* `getModule` and `getModules` methods to access moduleControllers more directly.
* New `is` and `on` methods for manually testing conditions once or continually.
* `destroy` method to destroy previously initialised nodes.
* Writing your own monitors is now a lot easier.
* Fixes and small improvements.

Read the [1.0.0 closed issue list](https://github.com/rikschennink/conditioner/issues?milestone=2&page=1&state=closed) for a complete overview.


## License

[MIT](http://www.opensource.org/licenses/mit-license.php)
