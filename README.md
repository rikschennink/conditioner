Conditioner
================================

**This is a work in progress, I'm still working on documentation and there's a list of work to be done available in the issues section.**

Introduction
--------------------------------

ConditionerJS is a JavaScript Module Loader based on RequireJS. ConditionerJS allows you to define conditions under which your JavaScript modules are allowed to be loaded and than takes care of loading them at the right moment.

Suppose you have a Google Maps module which transforms an anchor to a full blown Google Map. It would make sense to only activate the maps module if there's enough real estate on the screen to render a decent sized map. And to save a request and some bits and bytes you might only want to start loading the map once the map container becomes visible to the user.

The following HTML snippet shows how to setup this Google Map using ConditionerJS. There are two things going on, the Map module is bound using the `data-module` attribute and the required conditions are set via the `data-conditions` attribute.

```html
<a href="http://maps.google.com/?ll=51.741,3.822"
   data-module="ui/Map"
   data-conditions="media:{(min-width:40em)} and element:{seen}">
   ...
</a>
```

Now the HTML is setup, we only have to tell the Conditioner to look for modules in a certain section of the DOM and we're done. We can do this using the `loadModules` method.

```javascript
conditioner.loadModules(document);
```

You could say:
> Why not just put that condition in my Google Map module?

And of course that would work, at first.

As your project grows you might want to use the module on another page under different circumstances. So you add another condition, and then another, and another.

Your modules should, most of the time, not be concerned with the environment they are in. This is where ConditionerJS comes in. ConditionerJS will handle the environment and will initialize your module when the environment is suitable.

Because ConditionerJS takes care of initializing and loading modules. Modules all live separate from each other on their own little island (local scope). This makes expanding and maintaining a project much easier since Modules are not strongly coupled.


Documentation
--------------------------------
The documentation and a bunch of demos is located at [rikschennink.github.io/conditioner](http://rikschennink.github.io/conditioner/)


Requirements
--------------------------------
ConditionerJS relies on the availability of RequireJS. It does not require jQuery or any other JavaScript library.

* RequireJS
* Support for IE8 and up


License
--------------------------------
[MIT](http://www.opensource.org/licenses/mit-license.php)
