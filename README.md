# ConditionerJS

[![Build Status](https://travis-ci.org/rikschennink/conditioner.png?branch=master)](https://travis-ci.org/rikschennink/conditioner)

ConditionerJS is a javascript library for loading and unloading behavior based on environment conditions.


**Environment Aware**

Conditioner automatically loads and unloads modules based on the state of their surroundings. You define the required state, conditioner takes it from there.


**Frizz Free**

Modules are loaded separate from each other preventing them from getting into fights. Conditioner exposes an API that allows for structured peace negotiations between modules.

## Demo

Suppose you have a Google Maps module which transforms an anchor to a full blown Google Map. It would make sense to only activate the maps module if there's enough real estate on the screen to render a decent sized map. And to save a request and some bits and bytes you might only want to start loading the map once the map container becomes visible to the user.

The following HTML snippet shows how to setup this Google Map using Conditioner. There's two things going on, the Map module is bound using the `data-module` attribute and the required conditions are set via the `data-conditions` attribute.

```html
<a href="http://maps.google.com/?ll=51.741,3.822"
   data-module="ui/Map"
   data-conditions="media:{(min-width:40em)} and element:{seen}"> ... </a>
```

Now the HTML is setup, we only have to tell Conditioner to look for modules in a certain section of the DOM and we're done.

We can accomplish this by calling the `init` method.

```javascript
conditioner.init();
```

## Articles
* [Frizz Free JavaScript With ConditionerJS](http://www.smashingmagazine.com/2014/04/03/frizz-free-javascript-with-conditionerjs/)

## Documentation
You can find the API documentation and a selection of demos at [conditionerjs.com](http://conditionerjs.com)

## Requirements
Conditioner expects an AMD loader to be available. It's been tested with [RequireJS](http://requirejs.org), [Almond](https://github.com/jrburke/almond) and [Curl](https://github.com/cujojs/curl). As long as your AMD loader follows the [AMD spec](https://github.com/amdjs/amdjs-api) it should be fine.

If you're not into AMD and prefer [Browserify](http://browserify.org) that's fine too but keep in mind that your optimized file should contain all modules. If you want the best of both worlds you might be interested in [WebPack](http://webpack.github.io).

* AMD Loader / CommonJS Preprocessor
* Modern browser, IE8 is supported but requires a bit of shimming.

## Feedback, Comments, Critique
[Hit me on Twitter](http://twitter.com/rikschennink)

## License
[MIT](http://www.opensource.org/licenses/mit-license.php)
