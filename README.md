# Conditioner

**This library is still under development so new versions might break backwards compatibility.**

## Introduction

Conditioner.js is a javascript library for loading and unloading behavior based on environment conditions.


### Environment Aware

Conditioner automatically loads and unloads modules based on the state of their surroundings.

You define the required state, conditioner takes it from there.


### Frizz Free

Modules are loaded separate from each other preventing them  from getting into fights.

Conditioner exposes an API that allows for structured peace negotiations between modules.


### Example

Suppose you have a Google Maps module which transforms an anchor to a full blown Google Map. It would make sense to only activate the maps module if there's enough real estate on the screen to render a decent sized map. And to save a request and some bits and bytes you might only want to start loading the map once the map container becomes visible to the user.

The following HTML snippet shows how to setup this Google Map using Conditioner. There are two things going on, the Map module is bound using the `data-module` attribute and the required conditions are set via the `data-conditions` attribute.

```html
<a href="http://maps.google.com/?ll=51.741,3.822"
   data-module="ui/Map"
   data-conditions="media:{(min-width:40em)} and element:{seen}"> ... </a>
```

Now the HTML is setup, we only have to tell the Conditioner to look for modules in a certain section of the DOM and we're done. 

We can accomplish this by calling the `init` method.

```javascript
conditioner.init();
```

## Documentation
The documentation and a bunch of demos is located at [conditionerjs.com](http://conditionerjs.com)

## Requirements
Conditioner relies on the availability of [RequireJS](http://requirejs.org).

* RequireJS
* Modern browser, IE8 supported but without the media queries.


## Travis Build Status

Develop [![Build Status](https://travis-ci.org/rikschennink/conditioner.png?branch=develop)](https://travis-ci.org/moment/moment)

## Feedback, Comments, Critique
[Contact me on Twitter](http://twitter.com/rikschennink)

## License
[MIT](http://www.opensource.org/licenses/mit-license.php)
