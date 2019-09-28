/* conditioner-core 2.3.3 */
(function (global, factory) {
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

	var _slicedToArray = function () {
		function sliceIterator(arr, i) {
			var _arr = [];
			var _n = true;
			var _d = false;
			var _e = undefined;

			try {
				for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
					_arr.push(_s.value);

					if (i && _arr.length === i) break;
				}
			} catch (err) {
				_d = true;
				_e = err;
			} finally {
				try {
					if (!_n && _i["return"]) _i["return"]();
				} finally {
					if (_d) throw _e;
				}
			}

			return _arr;
		}

		return function (arr, i) {
			if (Array.isArray(arr)) {
				return arr;
			} else if (Symbol.iterator in Object(arr)) {
				return sliceIterator(arr, i);
			} else {
				throw new TypeError("Invalid attempt to destructure non-iterable instance");
			}
		};
	}();

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
	var bindModule = function bindModule(element, unbind) {
		// gets the name of the module from the element, we assume the name is an alias
		var alias = runPlugin('moduleGetName', element);

		// sets the name of the plugin, this does nothing by default but allows devs to turn an alias into the actual module name
		var name = chainPlugins('moduleSetName', alias);

		// internal state
		var state = {
			destruct: null, // holder for unload method (function returned by module constructor)
			mounting: false
		};

		// api wrapped around module object
		var boundModule = {
			// original name as found on the element
			alias: alias,

			// transformed name
			name: name,

			// reference to the element the module is bound to
			element: element,

			// is the module currently mounted?
			mounted: false,

			// unmounts the module
			unmount: function unmount() {
				// can't be unmounted if no destroy method has been supplied
				// can't be unmounted if not mounted
				if (!state.destruct || !boundModule.mounted) return;

				// about to unmount the module
				eachPlugins('moduleWillUnmount', boundModule);

				// clean up
				state.destruct();

				// no longer mounted
				boundModule.mounted = false;

				// done unmounting the module
				eachPlugins('moduleDidUnmount', boundModule);

				// done unmounting
				boundModule.onunmount.apply(element);
			},

			// requests and loads the module
			mount: function mount() {
				// can't mount an already mounted module
				// can't mount a module that is currently mounting
				if (boundModule.mounted || state.mounting) return;

				// now mounting module
				state.mounting = true;

				// about to mount the module
				eachPlugins('moduleWillMount', boundModule);

				// get the module
				runPlugin('moduleImport', name).then(function (module) {
					// initialise the module, module can return a destroy mehod
					state.destruct = runPlugin('moduleGetDestructor', runPlugin('moduleGetConstructor', module).apply(undefined, _toConsumableArray(runPlugin('moduleSetConstructorArguments', name, element))));

					// no longer mounting
					state.mounting = false;

					// module is now mounted
					boundModule.mounted = true;

					// did mount the module
					eachPlugins('moduleDidMount', boundModule);

					// module has now loaded lets fire the onload event so everyone knows about it
					boundModule.onmount.apply(element, [boundModule]);
				}).catch(function (error) {
					// failed to mount so no longer mounting
					state.mounting = false;

					// failed to mount the module
					eachPlugins('moduleDidCatch', error, boundModule);

					// callback for this specific module
					boundModule.onmounterror.apply(element, [error, boundModule]);

					// let dev know
					throw new Error('Conditioner: ' + error);
				});

				// return state object
				return boundModule;
			},

			// unmounts the module and destroys the attached monitors
			destroy: function destroy() {

				// about to destroy the module
				eachPlugins('moduleWillDestroy', boundModule);

				// not implemented yet
				boundModule.unmount();

				// did destroy the module
				eachPlugins('moduleDidDestroy', boundModule);

				// call public ondestroy so dev can handle it as well
				boundModule.ondestroy.apply(element);

				// call the destroy callback so monitor can be removed as well
				unbind();
			},

			// called when fails to bind the module
			onmounterror: function onmounterror() {},

			// called when the module is loaded, receives the state object, scope is set to element
			onmount: function onmount() {},

			// called when the module is unloaded, scope is set to element
			onunmount: function onunmount() {},

			// called when the module is destroyed
			ondestroy: function ondestroy() {}
		};

		// done!
		return boundModule;
	};

	var queryParamsRegex = /(was)? ?(not)? ?@([a-z]+) ?(.*)?/;
	var queryRegex = /(?:was )?(?:not )?@[a-z]+ ?.*?(?:(?= and (?:was )?(?:not )?@[a-z])|$)/g;

	// convert context values to booleans if value is undefined or a boolean described as string
	var toContextValue = function toContextValue(value) {
		return typeof value === 'undefined' || value === 'true' ? true : value === 'false' ? false : value;
	};

	var extractParams = function extractParams(query) {
		var _query$match = query.match(queryParamsRegex),
		    _query$match2 = _slicedToArray(_query$match, 5),
		    retain = _query$match2[1],
		    invert = _query$match2[2],
		    name = _query$match2[3],
		    value = _query$match2[4];

		// extract groups, we ignore the first array index which is the entire matches string
		return [name, toContextValue(value), invert === 'not', retain === 'was'];
	};

	// @media (min-width:30em) and was @visible true  ->  [ ['media', '(min-width:30em)', false, false], ['visible', 'true', false, true] ]
	var parseQuery = function parseQuery(query) {
		return query.match(queryRegex).map(extractParams);
	};

	// add intert and retain properties to monitor
	var decorateMonitor = function decorateMonitor(monitor, invert, retain) {
		monitor.invert = invert;
		monitor.retain = retain;
		monitor.matched = false;
		return monitor;
	};

	// finds monitor plugins and calls the create method on the first found monitor
	var getContextMonitor = function getContextMonitor(element, name, context) {
		var monitor = getPlugins('monitor').find(function (monitor) {
			return monitor.name === name;
		});
		// @exclude
		if (!monitor) {
			throw new Error('Conditioner: Cannot find monitor with name "@' + name + '". Only the "@media" monitor is always available. Custom monitors can be added with the `addPlugin` method using the `monitors` key. The name of the custom monitor should not include the "@" symbol.');
		}
		// @endexclude
		return monitor.create(context, element);
	};

	// test if monitor contexts are currently valid
	var matchMonitors = function matchMonitors(monitors) {
		return monitors.reduce(function (matches, monitor) {
			// an earlier monitor returned false, so current context will no longer be suitable
			if (!matches) return false;

			// get current match state, takes "not" into account
			var matched = monitor.invert ? !monitor.matches : monitor.matches;

			// mark monitor as has been matched in the past
			if (matched) monitor.matched = true;

			// if retain is enabled with "was" and the monitor has been matched in the past, there's a match
			if (monitor.retain && monitor.matched) return true;

			// return current match state
			return matched;
		},

		// initial value is always match
		true);
	};

	var monitor = exports.monitor = function monitor(query, element) {
		// setup monitor api
		var contextMonitor = {
			matches: false,
			active: false,
			onchange: function onchange() {},
			start: function start() {
				// cannot be activated when already active
				if (contextMonitor.active) return;

				// now activating
				contextMonitor.active = true;

				// listen for context changes
				monitorSets.forEach(function (monitorSet) {
					return monitorSet.forEach(function (monitor) {
						return monitor.addListener(onMonitorEvent);
					});
				});

				// get initial state
				onMonitorEvent();
			},
			stop: function stop() {
				// disable the monitor
				contextMonitor.active = false;

				// disable
				monitorSets.forEach(function (monitorSet) {
					return monitorSet.forEach(function (monitor) {
						// stop listening (if possible)
						if (!monitor.removeListener) return;
						monitor.removeListener(onMonitorEvent);
					});
				});
			},
			destroy: function destroy() {
				contextMonitor.stop();
				monitorSets.length = 0;
			}
		};

		// get different monitor sets (each 'or' creates a separate monitor set) > get monitors for each query
		var monitorSets = query.split(' or ').map(function (subQuery) {
			return parseQuery(subQuery).map(function (params) {
				return decorateMonitor.apply(undefined, [getContextMonitor.apply(undefined, [element].concat(_toConsumableArray(params)))].concat(_toConsumableArray(params.splice(2))));
			});
		});

		// if all monitors return true for .matches getter, we mount the module
		var onMonitorEvent = function onMonitorEvent() {
			// will keep returning false if one of the monitors does not match, else checks matches property
			var matches = monitorSets.reduce(function (matches, monitorSet) {
				return (
					// if one of the sets is true, it's all fine, no need to match the other sets
					matches ? true : matchMonitors(monitorSet)
				);
			}, false);

			// store new state
			contextMonitor.matches = matches;

			// if matches we mount the module, else we unmount
			contextMonitor.onchange(matches);
		};

		return contextMonitor;
	};

	// handles contextual loading and unloading
	var createContextualModule = function createContextualModule(query, boundModule) {
		// setup query monitor
		var moduleMonitor = monitor(query, boundModule.element);
		moduleMonitor.onchange = function (matches) {
			return matches ? boundModule.mount() : boundModule.unmount();
		};

		// start monitoring
		moduleMonitor.start();

		// export monitor
		return moduleMonitor;
	};

	// pass in an element and outputs a bound module object, will wrap bound module in a contextual module if required
	var createModule = function createModule(element) {

		// called when the module is destroyed
		var unbindModule = function unbindModule() {
			return monitor && monitor.destroy();
		};

		// bind the module to the element and receive the module wrapper API
		var boundModule = bindModule(element, unbindModule);

		// get context requirements for this module (if any have been defined)
		var query = runPlugin('moduleGetContext', element);

		// wait for the right context or load the module immidiately if no context supplied
		var monitor = query && createContextualModule(query, boundModule);

		// return module
		return query ? boundModule : boundModule.mount();
	};

	// parse a certain section of the DOM and load bound modules
	var hydrate = exports.hydrate = function hydrate(context) {
		return [].concat(_toConsumableArray(runPlugin('moduleSelector', context))).map(createModule);
	};

	// all registered plugins
	var plugins = [];

	// array includes 'polyfill', Array.prototype.includes was the only feature not supported on Edge
	var includes = function includes(arr, value) {
		return arr.indexOf(value) > -1;
	};

	// plugins are stored in an array as multiple plugins can subscribe to one hook
	var addPlugin = exports.addPlugin = function addPlugin(plugin) {
		return plugins.push(plugin);
	};

	// returns the plugins that match the requested type, as plugins can subscribe to multiple hooks we need to loop over the plugin keys to see if it matches
	var getPlugins = function getPlugins(type) {
		return plugins.filter(function (plugin) {
			return includes(Object.keys(plugin), type);
		}).map(function (plugin) {
			return plugin[type];
		});
	};

	// run for each of the registered plugins
	var eachPlugins = function eachPlugins(type) {
		for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			args[_key - 1] = arguments[_key];
		}

		return getPlugins(type).forEach(function (plugin) {
			return plugin.apply(undefined, args);
		});
	};

	// run registered plugins but chain input -> output (sync)
	var chainPlugins = function chainPlugins(type) {
		for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
			args[_key2 - 1] = arguments[_key2];
		}

		return getPlugins(type).reduce(function (args, plugin) {
			return [plugin.apply(undefined, _toConsumableArray(args))];
		}, args).shift();
	};

	// run on last registered plugin
	var runPlugin = function runPlugin(type) {
		for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
			args[_key3 - 1] = arguments[_key3];
		}

		return getPlugins(type).pop().apply(undefined, args);
	};

	// default plugin configuration
	addPlugin({
		// select all elements that have modules assigned to them
		moduleSelector: function moduleSelector(context) {
			return context.querySelectorAll('[data-module]');
		},

		// returns the context query as defined on the element
		moduleGetContext: function moduleGetContext(element) {
			return element.dataset.context;
		},

		// load the referenced module, by default searches global scope for module name
		moduleImport: function moduleImport(name) {
			return new Promise(function (resolve, reject) {
				if (self[name]) return resolve(self[name]);
				// @exclude
				reject('Cannot find module with name "' + name + '". By default Conditioner will import modules from the global scope, make sure a function named "' + name + '" is defined on the window object. The scope of a function defined with `let` or `const` is limited to the <script> block in which it is defined.');
				// @endexclude
			});
		},

		// returns the module constructor, by default we assume the module returned is a factory function
		moduleGetConstructor: function moduleGetConstructor(module) {
			return module;
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
});