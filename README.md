# ConditionerJS [![Build Status](http://img.shields.io/travis/rikschennink/conditioner/master.svg)](https://travis-ci.org/rikschennink/conditioner) [![Coverage Status](http://img.shields.io/coveralls/rikschennink/conditioner/master.svg)](https://coveralls.io/r/rikschennink/conditioner?branch=master)

ConditionerJS is a JavaScript library for loading and unloading behavior based on the current user context.


## Example

Load a Google Map module only if the screen is wider than 40em and the HTML element has been seen by the user.

```html
<a href="http://maps.google.com/?ll=51.741,3.822"
   data-module="ui/Map"
   data-conditions="media:{(min-width:40em)} and element:{was visible}"> ... </a>
```

When the module has loaded ConditionerJS will automatically unload it once the conditions are no longer valid (for instance when the user resizes the viewport). 


## Documentation

The documentation and a selection of demos can be found at [conditionerjs.com](http://conditionerjs.com)


## Installation


### Package

`npm install conditioner-js`

`bower install conditioner-js`


### Manual

Add the `conditioner.js` file (found in the dist/dev folder) to your project. You'll also have to add the monitors and utilities folder. The dev version of the conditioner framework includes logging statements, the dist/min folder contains a minimized version without these statements to limit file size.



## Running tests

Run `gulp test` to spin up the test suite. 


## Requirements

Conditioner expects an AMD loader to be available. It's been tested with [RequireJS](http://requirejs.org), [Almond](https://github.com/jrburke/almond) and [Curl](https://github.com/cujojs/curl). As long as your AMD loader follows the [AMD spec](https://github.com/amdjs/amdjs-api) it should be fine.

If you're not into AMD and prefer [Browserify](http://browserify.org) that's fine too but keep in mind that your optimized file should contain all modules. If you want the best of both worlds you might be interested in [WebPack](http://webpack.github.io).

* AMD Loader / CommonJS Preprocessor
* Modern browser, IE8 is supported but requires a bit of shimming.


## Resources

* [Frizz Free JavaScript With ConditionerJS](http://www.smashingmagazine.com/2014/04/03/frizz-free-javascript-with-conditionerjs/)
* [Presenting ConditionerJS At JavaScript MVC #9](http://rikschennink.nl/thoughts/frizz-free-javascript-mvc-meetup-9/)
* [Presenting ConditionerJS At Kabisa](http://rikschennink.nl/thoughts/frizz-free-javascript-fronteers-meetup/)


## Version History

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


## Feedback

Always interested in your opinion, please let me know on [Twitter](http://twitter.com/rikschennink) or contact met via [hello@rikschennink.nl](mailto:hello@rikschennink.nl)


## License

[MIT](http://www.opensource.org/licenses/mit-license.php)