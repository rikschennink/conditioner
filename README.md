# ConditionerJS [![Build Status](https://travis-ci.org/rikschennink/conditioner.svg?branch=master)](https://travis-ci.org/rikschennink/conditioner) [![Coverage Status](https://img.shields.io/coveralls/rikschennink/conditioner.svg)](https://coveralls.io/r/rikschennink/conditioner?branch=master)

[![Coverage Status](https://coveralls.io/repos/rikschennink/conditioner/badge.png?branch=master)](https://coveralls.io/r/rikschennink/conditioner?branch=master)

ConditionerJS is a javascript library for loading and unloading behavior based on environment conditions.


**Environment Aware**

Conditioner automatically loads and unloads modules based on the state of their surroundings. You define the required state, conditioner takes it from there.


**Frizz Free**

Modules loaded with Conditioner live on their own little islands. Conditioner exposes an API to facilitate safe communication between modules.

## Demo

Suppose you have a Google Maps module which transforms an anchor to a full blown Google Map. It would make sense to only activate the maps module if there's enough real estate on the screen to render a decent sized map. And to save a request and some bits and bytes you might only want to start loading the map once the map container becomes visible to the user.

The following HTML snippet shows how to setup this Google Map using Conditioner. There's two things going on, the Map module is bound using the `data-module` attribute and the required conditions are set via the `data-conditions` attribute.

```html
<a href="http://maps.google.com/?ll=51.741,3.822"
   data-module="ui/Map"
   data-conditions="media:{(min-width:40em)} and element:{was visible}"> ... </a>
```

Now the HTML is setup, we only have to tell Conditioner to look for modules in a certain section of the DOM and we're done.

We can accomplish this by calling the `init` method.

```javascript
conditioner.init();
```

Some more demos can be found in the [examples](http://conditionerjs.com/examples/conditions/) section of the documentation.

## Articles
* [Frizz Free JavaScript With ConditionerJS](http://www.smashingmagazine.com/2014/04/03/frizz-free-javascript-with-conditionerjs/)

## Documentation
You can find the API documentation and a selection of demos at [conditionerjs.com](http://conditionerjs.com)

## Requirements
Conditioner expects an AMD loader to be available. It's been tested with [RequireJS](http://requirejs.org), [Almond](https://github.com/jrburke/almond) and [Curl](https://github.com/cujojs/curl). As long as your AMD loader follows the [AMD spec](https://github.com/amdjs/amdjs-api) it should be fine.

If you're not into AMD and prefer [Browserify](http://browserify.org) that's fine too but keep in mind that your optimized file should contain all modules. If you want the best of both worlds you might be interested in [WebPack](http://webpack.github.io).

* AMD Loader / CommonJS Preprocessor
* Modern browser, IE8 is supported but requires a bit of shimming.

## History

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
If you like what you're seeing, send me smiley faces on [Twitter](http://twitter.com/rikschennink) or sponsor through [Gittip](https://www.gittip.com/rikschennink/)!

## License
[MIT](http://www.opensource.org/licenses/mit-license.php)
