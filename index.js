// links the module to the element and exposes a callback api object
const bindModule = (element, unbind) => {
	// gets the name of the module from the element, we assume the name is an alias
	const alias = runPlugin('moduleGetName', element);

	// sets the name of the plugin, this does nothing by default but allows devs to turn an alias into the actual module name
	const name = chainPlugins('moduleSetName', alias);

	// internal state
	const state = {
		destruct: null, // holder for unload method (function returned by module constructor)
		mounting: false
	};

	// api wrapped around module object
	const boundModule = {
		// original name as found on the element
		alias,

		// transformed name
		name,

		// reference to the element the module is bound to
		element,

		// is the module currently mounted?
		mounted: false,

		// unmounts the module
		unmount: () => {
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
		mount: () => {
			// can't mount an already mounted module
			// can't mount a module that is currently mounting
			if (boundModule.mounted || state.mounting) return;

            // now mounting module
			state.mounting = true;
			
			// about to mount the module
			eachPlugins('moduleWillMount', boundModule);

			// get the module
			runPlugin('moduleImport', name)
				.then(module => {
					// initialise the module, module can return a destroy mehod
					state.destruct = runPlugin(
						'moduleGetDestructor',
						runPlugin('moduleGetConstructor', module)(
							...runPlugin('moduleSetConstructorArguments', name, element)
						)
					);

					// no longer mounting
					state.mounting = false;

					// module is now mounted
					boundModule.mounted = true;

					// did mount the module
					eachPlugins('moduleDidMount', boundModule);

					// module has now loaded lets fire the onload event so everyone knows about it
					boundModule.onmount.apply(element, [boundModule]);
				})
				.catch(error => {
					// failed to mount so no longer mounting
					state.mounting = false;

					// failed to mount the module
					eachPlugins('moduleDidCatch', error, boundModule);

					// callback for this specific module
					boundModule.onmounterror.apply(element, [error, boundModule]);

					// let dev know
					throw new Error(`Conditioner: ${error}`);
				});

			// return state object
			return boundModule;
		},

		// unmounts the module and destroys the attached monitors
		destroy: function() {

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
		onmounterror: function() {},

		// called when the module is loaded, receives the state object, scope is set to element
		onmount: function() {},

		// called when the module is unloaded, scope is set to element
		onunmount: function() {},

		// called when the module is destroyed
		ondestroy: function() {}
	};

	// done!
	return boundModule;
};

const queryParamsRegex = /(was)? ?(not)? ?@([a-z]+) ?(.*)?/;
const queryRegex = /(?:was )?(?:not )?@[a-z]+ ?.*?(?:(?= and (?:was )?(?:not )?@[a-z])|$)/g;

// convert context values to booleans if value is undefined or a boolean described as string
const toContextValue = value =>
	typeof value === 'undefined' || value === 'true' ? true : value === 'false' ? false : value;

const extractParams = query => {
	const [, retain, invert, name, value] = query.match(queryParamsRegex); // extract groups, we ignore the first array index which is the entire matches string
	return [name, toContextValue(value), invert === 'not', retain === 'was'];
};

// @media (min-width:30em) and was @visible true  ->  [ ['media', '(min-width:30em)', false, false], ['visible', 'true', false, true] ]
const parseQuery = query => query.match(queryRegex).map(extractParams);

// add intert and retain properties to monitor
const decorateMonitor = (monitor, invert, retain) => {
	monitor.invert = invert;
	monitor.retain = retain;
	monitor.matched = false;
	return monitor;
};

// finds monitor plugins and calls the create method on the first found monitor
const getContextMonitor = (element, name, context) => {
	const monitor = getPlugins('monitor').find(monitor => monitor.name === name);
	// @exclude
	if (!monitor) {
		throw new Error(`Conditioner: Cannot find monitor with name "@${name}". Only the "@media" monitor is always available. Custom monitors can be added with the \`addPlugin\` method using the \`monitors\` key. The name of the custom monitor should not include the "@" symbol.`);
	}
	// @endexclude
	return monitor.create(context, element);
};

// test if monitor contexts are currently valid
const matchMonitors = monitors =>
	monitors.reduce(
		(matches, monitor) => {
			// an earlier monitor returned false, so current context will no longer be suitable
			if (!matches)  return false;

			// get current match state, takes "not" into account
			const matched = monitor.invert ? !monitor.matches : monitor.matches;

			// mark monitor as has been matched in the past
			if (matched) monitor.matched = true;

			// if retain is enabled with "was" and the monitor has been matched in the past, there's a match
			if (monitor.retain && monitor.matched) return true;

			// return current match state
			return matched;
		},

		// initial value is always match
		true
	);

export const monitor = (query, element) => {
	// setup monitor api
	const contextMonitor = {
		matches: false,
		active: false,
		onchange: function() {},
		start: () => {
			// cannot be activated when already active
			if (contextMonitor.active) return;

			// now activating
			contextMonitor.active = true;

			// listen for context changes
			monitorSets.forEach(monitorSet =>
				monitorSet.forEach(monitor => monitor.addListener(onMonitorEvent))
			);

			// get initial state
			onMonitorEvent();
		},
		stop: () => {
			// disable the monitor
			contextMonitor.active = false;

			// disable
			monitorSets.forEach(monitorSet =>
				monitorSet.forEach(monitor => {
					// stop listening (if possible)
					if (!monitor.removeListener) return;
					monitor.removeListener(onMonitorEvent);
				})
			);
		},
		destroy: () => {
			contextMonitor.stop();
			monitorSets.length = 0;
		}
	};

	// get different monitor sets (each 'or' creates a separate monitor set) > get monitors for each query
	const monitorSets = query
		.split(' or ')
		.map(subQuery =>
			parseQuery(subQuery).map(params =>
				decorateMonitor(getContextMonitor(element, ...params), ...params.splice(2))
			)
		);

	// if all monitors return true for .matches getter, we mount the module
	const onMonitorEvent = () => {
		// will keep returning false if one of the monitors does not match, else checks matches property
		const matches = monitorSets.reduce((matches, monitorSet) => 
			// if one of the sets is true, it's all fine, no need to match the other sets
			matches ? true : matchMonitors(monitorSet)
		, false);

		// store new state
		contextMonitor.matches = matches;

		// if matches we mount the module, else we unmount
		contextMonitor.onchange(matches);
	};

	return contextMonitor;
};

// handles contextual loading and unloading
const createContextualModule = (query, boundModule) => {
	// setup query monitor
	const moduleMonitor = monitor(query, boundModule.element);
	moduleMonitor.onchange = matches => matches ? boundModule.mount() : boundModule.unmount();

	// start monitoring
	moduleMonitor.start();

	// export monitor
	return moduleMonitor;
};

// pass in an element and outputs a bound module object, will wrap bound module in a contextual module if required
const createModule = element => {

	// called when the module is destroyed
	const unbindModule = () => monitor && monitor.destroy();

	// bind the module to the element and receive the module wrapper API
	const boundModule = bindModule(element, unbindModule);

	// get context requirements for this module (if any have been defined)
	const query = runPlugin('moduleGetContext', element);

	// wait for the right context or load the module immidiately if no context supplied
	const monitor = query && createContextualModule(query, boundModule);

	// return module
	return query ? boundModule : boundModule.mount();
};

// parse a certain section of the DOM and load bound modules
export const hydrate = context => [...runPlugin('moduleSelector', context)].map(createModule);

// all registered plugins
const plugins = [];

// array includes 'polyfill', Array.prototype.includes was the only feature not supported on Edge
const includes = (arr, value) => arr.indexOf(value) > -1;

// plugins are stored in an array as multiple plugins can subscribe to one hook
export const addPlugin = plugin => plugins.push(plugin);

// returns the plugins that match the requested type, as plugins can subscribe to multiple hooks we need to loop over the plugin keys to see if it matches
const getPlugins = type =>
	plugins.filter(plugin => includes(Object.keys(plugin), type)).map(plugin => plugin[type]);

// run for each of the registered plugins
const eachPlugins = (type, ...args) => getPlugins(type).forEach(plugin => plugin(...args));

// run registered plugins but chain input -> output (sync)
const chainPlugins = (type, ...args) =>
	getPlugins(type)
		.reduce((args, plugin) => [plugin(...args)], args)
		.shift();

// run on last registered plugin
const runPlugin = (type, ...args) => getPlugins(type).pop()(...args);

// default plugin configuration
addPlugin({
	// select all elements that have modules assigned to them
	moduleSelector: context => context.querySelectorAll('[data-module]'),

	// returns the context query as defined on the element
	moduleGetContext: element => element.dataset.context,

	// load the referenced module, by default searches global scope for module name
	moduleImport: name =>
		new Promise((resolve, reject) => {
			if (self[name]) return resolve(self[name]);
			// @exclude
			reject(
				`Cannot find module with name "${name}". By default Conditioner will import modules from the global scope, make sure a function named "${name}" is defined on the window object. The scope of a function defined with \`let\` or \`const\` is limited to the <script> block in which it is defined.`
			);
			// @endexclude
		}),

	// returns the module constructor, by default we assume the module returned is a factory function
	moduleGetConstructor: module => module,

	// returns the module destrutor, by default we assume the constructor exports a function
	moduleGetDestructor: moduleExports => moduleExports,

	// arguments to pass to the module constructor as array
	moduleSetConstructorArguments: (name, element) => [element],

	// where to get name of module
	moduleGetName: element => element.dataset.module,

	// default media query monitor
	monitor: {
		name: 'media',
		create: context => self.matchMedia(context)
	}
});
