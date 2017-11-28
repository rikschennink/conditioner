[![npm version](https://badge.fury.io/js/conditioner-core.svg)](https://badge.fury.io/js/conditioner-core)

# Conditioner  <img src="./logo.svg" width="56"/>

Conditioner provides a straight forward Progressive Enhancement based solution for linking JavaScript modules to DOM elements.

Modules can be linked based on contextual parameters like viewport size and element visibilty making Conditioner your perfect Responsive Design companion.


## Example

Mount a component (like a Date Picker, Section Toggler or Carrousel), but only do it on wide viewports.

```html
<h2 data-module="/ui/component.js"
    data-context="@media (min-width:30em)"> ... </h2>
```

If the viewport is resized or rotated and suddenly it's smaller than `30em` Conditioner will automatically unmount the component.


## Demo

[![](https://raw.githubusercontent.com/rikschennink/conditioner/master/demo.gif)](https://codepen.io/rikschennink/details/mqVzXb/)


## Features

- Progressive Enhancement as a starting point 💆🏻
- Perfect for a Responsive Design strategy
- Declarative way to bind logic to elements, [why this is good](http://rikschennink.nl/thoughts/binding-behavior-you-are-doing-it-wrong/)
- No dependencies and small footprint (~1KB gzipped)
- Compatible with ES `import()`, AMD `require()` and webpack
- Can be extended easily with plugins



## Installation

Install with npm:

```bash
npm i conditioner-core --save
```

Using a CDN:

```html
<script src="https://unpkg.com/conditioner-core/conditioner-core.js"></script>
```



## Setup

Using Conditioner on the global scope:

```html
<script src="https://unpkg.com/conditioner-core/conditioner-core.js"></script>
<script>

// mount modules!
conditioner.hydrate( document.documentElement );

</script>
```

Using Conditioner async with ES6 modules:

```js
import('conditioner-core/index.js').then(conditioner => {
    
    conditioner.addPlugin({

        // converts module aliases to paths
        moduleSetName: (name) => `/ui/${ name }.js`,

        // get the module constructor
        moduleGetConstructor: (module) => module.default,

        // fetch module with dynamic import
        moduleImport: (name) => import(name),

    });

    // mount modules!
    conditioner.hydrate( document.documentElement );
});
```

Using Conditioner with webpack:

```js
import * as conditioner from 'conditioner-core';

conditioner.addPlugin({

    // converts module aliases to paths
    moduleSetName: (name) => `./ui/${ name }.js`,
    
    // get the module constructor
    moduleGetConstructor: (module) => module.default,

    // override the import
    moduleImport: (name) => import(`${ name }`)

});

// lets go!
conditioner.hydrate( document.documentElement );
```

Using Conditioner in AMD modules:

```js
require(['conditioner-core.js'], function(conditioner) {

    // setup AMD require
    conditioner.addPlugin({

        // converts module aliases to paths
        moduleSetName: function(name) { return '/ui/' + name + '.js' },

        // setup AMD require
        moduleImport: function(name) {
            return new Promise(function(resolve) {
                require([name], function(module) {
                    resolve(module);
                });
            });
        }

    });

    // mount modules!
    conditioner.hydrate( document.documentElement );
});
```



A collection of boilerplates to get you started with various project setups:

- [ES6](https://github.com/rikschennink/conditioner-boilerplate-es6)
- [Webpack](https://github.com/rikschennink/conditioner-boilerplate-webpack)
- [Browserify](https://github.com/rikschennink/conditioner-boilerplate-browserify)
- [AMD](https://github.com/rikschennink/conditioner-boilerplate-amd)
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
`mounted`                                      | Boolean indicating wether the module is currently mounted.
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
`moduleImport(name)`                           | Imports the module with the given name, should return a `Promise`. By default searches global scope for module name.
`moduleGetConstructor(module)`                 | Gets the constructor method from the module object, by default expects module parameter itself to be a factory function.
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
    moduleSetName: (name) => `${ name }.js`
});
```

Next up is a plugin that adds a `visible` monitor using the `IntersectionObserver` API. Monitors can be used in a context query by prefixing the name with an `@`.

Monitor plugins should mimic the [`MediaQueryList`](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList) API. Each monitor should expose a `matches` property and an `addListener` method.

```js
conditioner.addPlugin({
    
    monitor: {
        name: 'visible',
        create: (context, element) => ({

            // current match state
            matches: false,

            // called by conditioner to start listening for changes
            addListener (change) {

                new IntersectionObserver(entries => {

                    // update the matches state
                    this.matches = entries.pop().isIntersecting == context;

                    // inform conditioner of the new state
                    change();

                }).observe(element);

            }
            
        })
    }

});
```

With our `visible` monitor registered, we are ready to use it in a context query:

```html
<div data-module="/ui/component.js" data-context="@visible true"></div>
```

To make context queries easier to read Conditioner will automatically set the context value to `true` if its omitted. The following context query is the same as `@visible true`.

```html
<div data-module="/ui/component.js" data-context="@visible"></div>
```

Instead of writing `@visible false` we can use the `not` operator to invert the monitor state, this little bit of syntactic suger makes context queries easier to read.

The `@visible` context monitor will mount modules when they scroll into the users view and unmount modules when they are no longer visible to the user.

This might be exactly what you want (for instance if you're doing intro and outro animations). It's however more likely you want the modules to stick around after they've been loaded for the first time.

You can achieve this by adding the `was` statement.

```html
<div data-module="/ui/component.js" data-context="was @visible"></div>
```

Now the module will stay mounted after its context has been matched for the first time.

Using the `and` statement you can string multiple monitors together allowing for very precise context queries.

```html
<div data-module="/ui/component.js" data-context="@media (min-width:30em) and was @visible"></div>
```



## Polyfilling

To use Conditioner on older browsers you'll have to polyfill some modern JavaScript features. You could also opt to use a [Mustard Cut](http://responsivenews.co.uk/post/18948466399/cutting-the-mustard) and prevent your JavaScript from running on older browsers by wrapping the `hydrate` method in a feature detection statement.

```js
// this will only run on IE10 and up
// https://caniuse.com/#feat=pagevisibility
if ('visibilityState' in document) {
    conditioner.hydrate();
}
```

Polyfills required for Internet Explorer 11

- [`Array.prototype.find`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find#Browser_compatibility)
- [`Array.prototype.from`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Browser_compatibility)
- [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Browser_compatibility)

Internet Explorer 10

- [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#Browser_compatibility)

You can either polyfill `dataset` or add the following plugin to override the `moduleGetName` and `moduleGetContext` hooks (which use `dataset`).

```js
conditioner.addPlugin({
    moduleGetName: function(element) { return element.getAttribute('data-module'); },
    moduleGetContext: function(element) { return element.getAttribute('data-context'); }
});
```

The above plugin will also be required when you need to mount modules on SVG elements. Browser support for use of [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/SVGElement/dataset#Browser_compatibility) on SVG elements is a lot worse than HTML elements.



## License

[MIT](http://www.opensource.org/licenses/mit-license.php)
