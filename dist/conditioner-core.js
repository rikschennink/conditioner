/* conditioner-core 2.0.0 */(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.conditioner = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }

            return arr2;
        } else {
            return Array.from(arr);
        }
    }

    // links the module to the element and exposes a callback api object
    var bindModule = function bindModule(element) {

        var alias = runPlugin('moduleGetName', element);

        var name = chainPlugins('moduleSetName', alias);

        var state = {
            destroy: null // holder for unload method
        };

        // module config
        var boundModule = {

            alias: alias,

            // module name
            name: name,

            // reference to the element
            element: element,

            // unload is empty function so we can blindly call it if initial context does not match
            unmount: function unmount() {

                // can't be destroyed as no destroy method has been supplied
                if (!state.destroy) {
                    return;
                }

                // about to unmount the module
                eachPlugins('moduleWillUnmount', boundModule);

                // clean up 
                state.destroy();

                // done unmounting the module
                eachPlugins('moduleDidUnmount', boundModule);

                // done destroying
                boundModule.onunmount.apply(element);
            },

            // requests and loads the module
            mount: function mount() {

                // about to mount the module
                eachPlugins('moduleWillMount', boundModule);

                // get the module
                runPlugin('moduleImport', name).catch(function (error) {

                    // failed to mount the module
                    eachPlugins('moduleDidCatch', error, boundModule);

                    // callback for this specific module
                    boundModule.onmounterror.apply(element, [error, boundModule]);
                }).then(function (module) {

                    // initialise the module, module can return a destroy mehod ()
                    state.destroy = runPlugin('moduleGetDestructor', runPlugin('moduleGetConstructor', module).apply(undefined, _toConsumableArray(runPlugin('moduleSetConstructorArguments', name, element, module))));

                    // did mount the module
                    eachPlugins('moduleDidMount', boundModule);

                    // module has now loaded lets fire the onload event so everyone knows about it
                    boundModule.onmount.apply(element, [boundModule]);
                });

                // return state object
                return boundModule;
            },

            // called when fails to bind the module
            onmounterror: function onmounterror() {},

            // called when the module is loaded, receives the state object, scope is set to element
            onmount: function onmount() {},

            // called when the module is unloaded, scope is set to element
            onunmount: function onunmount() {}
        };

        // done!
        return boundModule;
    };

    // @media (min-width:30em) and @visible true  ->  ['media', '(min-width:30em)'], ['visible', 'true']
    var parseQuery = function parseQuery(query) {
        return query.substr(1).split(' and @').map(function (q) {
            return (/^([a-z]+) (.+)/.exec(q).splice(1)
            );
        });
    };

    // returns a context monitor from the plugins array
    var getContextMonitor = function getContextMonitor(name, context, element) {
        var monitors = getPlugins('monitor');
        var monitor = monitors.find(function (monitor) {
            return monitor.name === name;
        });
        return monitor.create(context, element);
    };

    // handles contextual loading and unloading
    var createContextualModule = function createContextualModule(query, boundModule) {

        // get monitors for supplied query
        var monitors = parseQuery(query).map(function (params) {
            return getContextMonitor.apply(undefined, _toConsumableArray(params).concat([boundModule.element]));
        });

        // if all monitors return true for .matches getter, we mount the module
        var onchange = function onchange() {

            // will keep returning false if one of the monitors does not match, else checks matches property
            var matches = monitors.reduce(function (matches, monitor) {
                return matches ? monitor.matches : false;
            }, true);

            // if matches we mount the module, else we unmount
            matches ? boundModule.mount() : boundModule.unmount();
        };

        // listen for context changes
        monitors.forEach(function (monitor) {
            return monitor.addListener(onchange);
        });

        // test if is currently matching
        onchange();

        return boundModule;
    };

    // creates modules.. you don't say!?
    var createModule = function createModule(element) {

        // bind the module to the element and receive the module wrapper API
        var boundModule = bindModule(element);

        // get context requirements for this module (if any have been defined)
        var query = runPlugin('moduleGetContext', element);

        // wait for the right context or load the module immidiately if no context supplied
        return query ? createContextualModule(query, boundModule) : boundModule.mount();
    };

    // parse a certain section of the DOM and load bound modules
    var hydrate = function hydrate(context) {
        return [].concat(_toConsumableArray(runPlugin('moduleSelector', context))).map(createModule);
    };

    // plugin api
    var plugins = [];
    var addPlugin = function addPlugin(plugin) {
        return plugins.push(plugin);
    };
    var getPlugins = function getPlugins(type) {
        return plugins.filter(function (plugin) {
            return Object.keys(plugin).includes(type);
        }).map(function (plugin) {
            return plugin[type];
        });
    };
    var eachPlugins = function eachPlugins(type) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        return getPlugins(type).forEach(function (plugin) {
            return plugin.apply(undefined, args);
        });
    };
    var chainPlugins = function chainPlugins(type) {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
        }

        return getPlugins(type).reduce(function (args, plugin) {
            return [plugin.apply(undefined, _toConsumableArray(args))];
        }, args).shift();
    };
    var runPlugin = function runPlugin(type) {
        for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
            args[_key3 - 1] = arguments[_key3];
        }

        return getPlugins(type).pop().apply(undefined, args);
    };

    // default plugin
    addPlugin({

        // select all elements that have modules assigned to them
        moduleSelector: function moduleSelector(context) {
            return context.querySelectorAll('[data-module]');
        },

        // returns the context query as defined on the element
        moduleGetContext: function moduleGetContext(element) {
            return element.dataset.context;
        },

        // load the referenced module, by default uses es6 dynamic module imports
        // passing the variable as a string prevents a webpack dependancy warning
        moduleImport: function moduleImport(name) {
            return import('' + name);
        },

        // returns the module constructor, by default we assume the module default exports a function
        moduleGetConstructor: function moduleGetConstructor(module) {
            return module.default;
        },

        // returns the module destrutor, by default we assume the constructor exports a function
        moduleGetDestructor: function moduleGetDestructor(moduleExports) {
            return moduleExports;
        },

        // arguments to pass to the module constructor as array
        moduleSetConstructorArguments: function moduleSetConstructorArguments(name, element) {
            return [element];
        },

        // where to get name of module
        moduleGetName: function moduleGetName(element) {
            return element.dataset.module;
        },

        // default media query monitor
        monitor: {
            name: 'media',
            create: function create(context) {
                return self.matchMedia(context);
            }
        }

    });

    // public api
    exports.hydrate = hydrate;
    exports.addPlugin = addPlugin;
});