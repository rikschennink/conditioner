
# Conditioner <img src="./logo.svg" width="56"/>

Conditioner provides a straight forward Progressive Enhancement based solution for linking JavaScript modules to DOM elements. Modules can be linked based on contextual parameters like viewport size and element visibilty making Conditioner your perfect Responsive Design companion.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rikschennink/conditioner/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/conditioner-core.svg)](https://badge.fury.io/js/conditioner-core)
[![Support on Patreon](https://img.shields.io/badge/support-patreon-salmon.svg)](https://www.patreon.com/rikschennink)

## Example

Mount a component (like a Date Picker, Section Toggler or Carrousel), but only do it on wide viewports and when the user has seen it.

```html
<h2 data-module="/ui/component.js"
    data-context="@media (min-width:30em) and was @visible"> ... </h2>
```

If the viewport is resized or rotated and suddenly it's smaller than `30em` Conditioner will automatically unmount the component.

## Demo

[![](https://raw.githubusercontent.com/rikschennink/conditioner/master/demo.gif)](https://codepen.io/rikschennink/details/mqVzXb/)

## Features

* Progressive Enhancement as a starting point 💆🏻
* Perfect for a Responsive Design strategy
* Declarative way to bind logic to elements, [why this is good](http://rikschennink.nl/thoughts/binding-behavior-you-are-doing-it-wrong/)
* No dependencies and small footprint (~1KB gzipped)
* Compatible with ES `import()`, AMD `require()` and webpack
* Can easily be extended with plugins

## Resources

* [Lazy Loading JavaScript with Conditioner on Smashing Magazine](https://www.smashingmagazine.com/2018/03/lazy-loading-with-conditioner-js/)

## Installation

Install with npm:

```bash
npm install conditioner-core --save
```

The package includes both development and product versions. Use `conditioner-core.min.js` for production. The ES Module version of Conditioner (`conditioner-core.esm.js`) is not compressed.

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

Using Conditioner async with ES modules:

```js
import('conditioner-core/conditioner-core.esm.js').then(conditioner => {
  conditioner.addPlugin({
    // converts module aliases to paths
    moduleSetName: name => `/ui/${name}.js`,

    // get the module constructor
    moduleGetConstructor: module => module.default,

    // fetch module with dynamic import
    moduleImport: name => import(name)
  });

  // mount modules!
  conditioner.hydrate(document.documentElement);
});
```

Using Conditioner with webpack:

```js
import * as conditioner from 'conditioner-core/conditioner-core.esm';

conditioner.addPlugin({
  // converts module aliases to paths
  moduleSetName: name => `./ui/${name}.js`,

  // get the module constructor
  moduleGetConstructor: module => module.default,

  // override the import
  moduleImport: name => import(`${name}`)
});

// lets go!
conditioner.hydrate(document.documentElement);
```

Using Conditioner in AMD modules:

```js
require(['conditioner-core.js'], function(conditioner) {
  // setup AMD require
  conditioner.addPlugin({
    // converts module aliases to paths
    moduleSetName: function(name) {
      return '/ui/' + name + '.js';
    },

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
  conditioner.hydrate(document.documentElement);
});
```

A collection of boilerplates to get you started with various project setups:

* [ES Modules](https://github.com/rikschennink/conditioner-boilerplate-esm)
* [Webpack](https://github.com/rikschennink/conditioner-boilerplate-webpack)
* [Browserify](https://github.com/rikschennink/conditioner-boilerplate-browserify)
* [AMD](https://github.com/rikschennink/conditioner-boilerplate-amd)
* [Global](https://github.com/rikschennink/conditioner-boilerplate-global)

## API

### Public Methods

Inspired by React and Babel, Conditioner has a tiny but extensible API.

| Method                        | Description                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `hydrate(element)`            | Mount modules found in the subtree of the passed element, returns an array of [bound module](#bound-module) objects. |
| `monitor(context[, element])` | Manually monitor a context. Returns a [context monitor](#context-monitor) object.                                    |
| `addPlugin(plugin)`           | Add a plugin to Conditioner to extend its core functionality.                                                        |

### Bound Module

Bound modules are returned by the `hydrate` method. Each bound module object wraps a module. It exposes a set of properties, methods and callbacks to interact with the module and its element.

| Property / Method                  | Description                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `alias`                            | Name found in `dataset.module`.                                                      |
| `name`                             | Module path after name has been passed through `moduleSetName`.                      |
| `element`                          | The element the module is bound to.                                                  |
| `mounted`                          | Boolean indicating wether the module is currently mounted.                           |
| `mount()`                          | Manually mount the module.                                                           |
| `unmount()`                        | Manually unmount the module.                                                         |
| `destroy()`                        | Unmounts the module and then removes any monitors.                                   |
| `onmount(boundModule)`             | Callback that runs when the module has been mounted. Scoped to element.              |
| `onmounterror(error, boundModule)` | Callback that runs when an error occurs during the mount process. Scoped to element. |
| `onunmount(boundModule)`           | Callback that runs when the module has been unmounted. Scoped to element.            |
| `ondestroy(boundModule)`           | Callback that runs when the module has been destroyed. Scoped to element.            |


### Context Monitor

Context Monitors are returned by the `monitor` method.

| Property / Method   | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| `matches`           | Boolean indicating wether the context is currently matches                         |
| `active`            | Boolean indicating wether it's actively monitoring the context                     |
| `start()`           | Start monitoring the context                                                       |
| `stop()`            | Stop monitoring the context                                                        |
| `destroy()`         | Stops monitoring the context and cleans up the monitor array                       |
| `onchange(matches)` | Callback that runs when one of the monitors in the context query reported a change |

An example setup is shown below.

```js
const viewportMonitor = conditioner.monitor('@media (min-width:30em) and was @visible');

viewportMonitor.onchange = matches => {
  console.log('context is matched', matches);
};

viewportMonitor.start();
```

### Plugins

Adding a plugin can be done with the `addPlugin` method, the method expects a plugin definition object.

Plugins can be used to override internal methods or add custom monitors to Conditioner.

We can link our plugins to the following hooks:

| Hook                                           | Description                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `moduleSelector(context)`                      | Selects all elements with modules within the given context and returns a `NodeList`.                                     |
| `moduleGetContext(element)`                    | Returns context requirements for the module. By default returns the `element.dataset.context` attribute.                 |
| `moduleImport(name)`                           | Imports the module with the given name, should return a `Promise`. By default searches global scope for module name.     |
| `moduleGetConstructor(module)`                 | Gets the constructor method from the module object, by default expects module parameter itself to be a factory function. |
| `moduleGetDestructor(moduleExports)`           | Gets the destructor method from the module constructor return value, by default expects a single function.               |
| `moduleSetConstructorArguments(name, element)` | Use to alter the arguments supplied to the module constructor, expects an `array` as return value.                       |
| `moduleGetName(element)`                       | Called to get the name of the module, by default retrieves the `element.dataset.module` value.                           |
| `moduleSetName(name)`                          | Called when the module name has been retrieved just before setting it.                                                   |
| `moduleWillMount(boundModule)`                 | Called before the module is mounted.                                                                                     |
| `moduleDidMount(boundModule)`                  | Called after the module is mounted.                                                                                      |
| `moduleWillUnmount(boundModule)`               | Called before the module is unmounted.                                                                                   |
| `moduleDidUnmount(boundModule)`                | Called after the module is unmounted.                                                                                    |
| `moduleWillDestroy(boundModule)`               | Called before the module is destroyed.                                                                                   |
| `moduleDidDestroy(boundModule)`                | Called after the module is destroyed.                                                                                    |
| `moduleDidCatch(error, boundModule)`           | Called when module import throws an error.                                                                               |
| `monitor`                                      | A collection of registered monitors. See monitor setup instructions below.                                               |

#### File Extension Plugin Example

Instead of referencing each module with file extension (`datepicker.js`) we want to leave out the extension and add it automatically.

We'll use the `moduleSetName` hook to achieve this:

```js
conditioner.addPlugin({
  moduleSetName: name => `${name}.js`
});
```

#### Element Visibility Monitor

Let's add a `visible` monitor using the [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) API. All our custom monitors can be used in context queries by prefixing the name with an `@`.

Monitor plugins should mimic the [`MediaQueryList`](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList) API. Each monitor should at least expose a `matches` property and an `addListener` method. To allow for the monitor to be unloaded we should also add the `removeListener` method, but it's optional.

```js
conditioner.addPlugin({
  // the plugin "monitor" hook
  monitor: {
    // the name of our monitor, not prefixed with "@"
    name: 'visible',

    // the monitor factory method, this will create our monitor
    create: (context, element) => ({
      // current match state
      matches: false,

      // called by conditioner to start listening for changes
      addListener(change) {
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

With our `visible` monitor registered, we are ready to use it in a context query.

```html
<div data-module="/ui/component.js" data-context="@visible true"></div>
```

To make context queries easier to read Conditioner will automatically set the context value to `true` if it's omitted. So the following context query is exactle the same as `@visible true`.

```html
<div data-module="/ui/component.js" data-context="@visible"></div>
```

To invert the monitor state we can use the `not` operator. Instead of writing `@visible false` we can now write `not @visible`, which again makes queries easier to read.

The `@visible` state context monitor will unload modules when they are no longer visible. This might be exactly what we want, for instance when animating element in and out of view. It's however more likely we want the modules to stick around after they've been loaded for the first time.

You can achieve this by adding the `was` statement.

```html
<div data-module="/ui/component.js" data-context="was @visible"></div>
```

Now the module will stay mounted after its context has been matched for the first time.

Let's string multiple monitors together with the `and` operator so we can do more precise context queries.

```html
<div data-module="/ui/component.js" data-context="@media (min-width:30em) and was @visible"></div>
```

Last but not least we can use the `or` to make exceptions. On small viewports we only mount the module when the element was visible, on big viewports we always mount the module.

```html
<div data-module="/ui/component.js" data-context="@media (max-width:30em) and was @visible or @media(min-width:30em)"></div>
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

* [`Array.prototype.find`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find#Browser_compatibility)
* [`Array.prototype.from`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Browser_compatibility)
* [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Browser_compatibility)

Internet Explorer 10

* [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#Browser_compatibility)

You can either polyfill `dataset` or add the following plugin to override the `moduleGetName` and `moduleGetContext` hooks (which use `dataset`).

```js
conditioner.addPlugin({
  moduleGetName: function(element) {
    return element.getAttribute('data-module');
  },
  moduleGetContext: function(element) {
    return element.getAttribute('data-context');
  }
});
```

The above plugin will also be required when you need to mount modules on SVG elements. Browser support for use of [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/SVGElement/dataset#Browser_compatibility) on SVG elements is a lot worse than HTML elements.

## License

[MIT](http://www.opensource.org/licenses/mit-license.php)
