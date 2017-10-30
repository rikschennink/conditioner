# Conditioner

Declaratively link JavaScript modules to your elements and mount them based on contextual parameters like viewport size and element visibilty.



## Features

- Progressive Enhancement!
- Declarative way to bind logic to elements
- Perfectly fits with Responsive Design
- Dynamic import support
- No dependencies
- Small footprint
- Easy to extend with plugins



## Example

Mount a `SectionToggler` module, but only do it on narrow viewports.

```html
<h2 data-module="/ui/SectionToggler.js"
    data-context="@media (max-width:30em)"> ... </h2>
```

Conditioner will unmount the SectionToggler when the context is no longer fitting. So when the user resizes or rotates the viewport and suddenly it's wider than `30em` the `SectionToggler` will be unmounted.



## Installation

Install from npm:

```bash
npm install conditioner-core --save
```


## Setup

When dynamic imports are supported Conditioner can be imported using the `import` statement.


Importing Conditioner in a page using the dynamic `import` statement:

```js
<script>
(async () => {

    // get conditioner module
    const conditioner = await import('./conditioner-nano.js');

    // parse the DOM
    conditioner.hydrate( document.documentElement );

})();
</script>
```


Using Conditioner in a module:

```js
import * as conditioner from 'conditioner-core';

conditioner.hydrate( document.documentElement );
```



## API

Method                      | Description
----------------------------|---------------
`hydrate(context)`          | Mount modules in a certain part of the DOM
`addPlugin(plugin)`         | Add a plugin to Conditioner to extend its core functionality

Mount all modules on the page.

```js
conditioner.hydrate( document.documentElement );
```



## Resources

Version 1.x

* [Frizz Free JavaScript With ConditionerJS](http://www.smashingmagazine.com/2014/04/03/frizz-free-javascript-with-conditionerjs/)
* [Presenting ConditionerJS At JavaScript MVC #9](http://rikschennink.nl/thoughts/frizz-free-javascript-mvc-meetup-9/)
* [Presenting ConditionerJS At Kabisa](http://rikschennink.nl/thoughts/frizz-free-javascript-fronteers-meetup/)



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