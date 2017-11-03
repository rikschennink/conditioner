// links the module to the element and exposes a callback api object
const bindModule = element => {

    // gets the name of the module from the element, we assume the name is an alias
    const alias = runPlugin('moduleGetName', element);

    // sets the name of the plugin, this does nothing by default but allows devs to turn an alias into the actual module name
    const name = chainPlugins('moduleSetName', alias);

    // internal state
    const state = {
        destroy: null, // holder for unload method,
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

        // unload is empty function so we can blindly call it if initial context does not match
        unmount: () => {

            // can't be unmounted if no destroy method has been supplied
            // can't be unmounted if not mounted
            if (!state.destroy || !boundModule.mounted) { return; }

            // about to unmount the module
            eachPlugins('moduleWillUnmount', boundModule);
            
            // clean up
            state.destroy();

            // no longer mounted
            boundModule.mounted = false;
            
            // done unmounting the module
            eachPlugins('moduleDidUnmount', boundModule);
            
            // done destroying
            boundModule.onunmount.apply(element);
        },

        // requests and loads the module
        mount: () => {

            // can't mount an already mounted module
            // can't mount a module that is currently mounting
            if (boundModule.mounted || state.mounting) {
                return;
            }

            // about to mount the module
            eachPlugins('moduleWillMount', boundModule);

            // get the module
            runPlugin('moduleImport', name)
                .catch( error => {

                    // failed to mount so no longer mounting
                    state.mounting = false;

                    // failed to mount the module
                    eachPlugins('moduleDidCatch', error, boundModule);
                    
                    // callback for this specific module
                    boundModule.onmounterror.apply(element, [error, boundModule]);

                    // log silently to console
                    console.warn(error);

                })
                .then( module => {

                    // initialise the module, module can return a destroy mehod
                    state.destroy = runPlugin('moduleGetDestructor', runPlugin('moduleGetConstructor', module)( ...runPlugin('moduleSetConstructorArguments', name, element, module) ) );
                    
                    // module is now mounted
                    boundModule.mounted = true;

                    // no longer mounting
                    state.mounting = false;

                    // did mount the module
                    eachPlugins('moduleDidMount', boundModule);
                    
                    // module has now loaded lets fire the onload event so everyone knows about it
                    boundModule.onmount.apply(element, [boundModule]);
                    
                });
            
            // return state object
            return boundModule;

        },

        // called when fails to bind the module
        onmounterror: function() {},

        // called when the module is loaded, receives the state object, scope is set to element
        onmount: function() {},

        // called when the module is unloaded, scope is set to element
        onunmount: function() {}
    };

    // done!
    return boundModule;
};


// splits the context query on 'and @' (to prevent splits in context value)
// extracts the name and value [name, value] (thats why the regex has two match groups)
const extractNameAndValue = query => /^([a-z]+) (.+)/.exec(query).splice(1)

// @media (min-width:30em) and @visible true  ->  [ ['media', '(min-width:30em)'], ['visible', 'true'] ]
const parseQuery = query => query
    .substr(1) // remove first @
    .split(' and @') // find the sub queries
    .map(extractNameAndValue); // get the query name and value as an array

// finds monitor plugins and calls the create method on the first found monitor
const getContextMonitor = (name, context, element) => getPlugins('monitor')
    .find(monitor => monitor.name === name)
    .create(context, element);

// handles contextual loading and unloading
const createContextualModule = (query, boundModule) => {
    
    // get monitors for supplied query
    const monitors = parseQuery(query).map(params => getContextMonitor(...params, boundModule.element));

    // if all monitors return true for .matches getter, we mount the module
    const onchange = () => {

        // will keep returning false if one of the monitors does not match, else checks matches property
        const matches = monitors.reduce((matches, monitor) => matches ? monitor.matches : false, true);

        // if matches we mount the module, else we unmount
        matches ? boundModule.mount() : boundModule.unmount();

    };
    
    // listen for context changes
    monitors.forEach(monitor => monitor.addListener(onchange));

    // test if is currently matching
    onchange();

    return boundModule;
};


// pass in an element and outputs a bound module object, will wrap bound module in a contextual module if required
const createModule = element => {
    
    // bind the module to the element and receive the module wrapper API
    const boundModule = bindModule(element);

    // get context requirements for this module (if any have been defined)
    const query = runPlugin('moduleGetContext', element);

    // wait for the right context or load the module immidiately if no context supplied
    return query ? createContextualModule( query, boundModule ) : boundModule.mount();

};


// parse a certain section of the DOM and load bound modules
const hydrate = context => [ ...runPlugin('moduleSelector', context) ].map( createModule );



// plugin api
const plugins = [];

// array includes 'polyfill', Array.prototype.includes was the only feature not supported on Edge
const includes = (arr, value) => arr.indexOf(value) > -1;

// plugins are stored in an array as multiple plugins can subscribe to one hook
const addPlugin = plugin => plugins.push(plugin);

// returns the plugins that match the requested type, as plugins can subscribe to multiple hooks we need to loop over the plugin keys to see if it matches
const getPlugins = type => plugins.filter( plugin => includes(Object.keys(plugin), type) ).map( plugin => plugin[type] )

// run for each of the registered plugins
const eachPlugins = (type, ...args) => getPlugins(type).forEach(plugin => plugin(...args));

// run registered plugins but chain input -> output (sync)
const chainPlugins = (type, ...args) => getPlugins(type).reduce((args, plugin) => [plugin(...args)], args).shift();

// run on last registered plugin
const runPlugin = (type, ...args) => getPlugins(type).pop()(...args);



// default plugin
addPlugin({

    // select all elements that have modules assigned to them
    moduleSelector: context => context.querySelectorAll('[data-module]'),

    // returns the context query as defined on the element
    moduleGetContext: element => element.dataset.context,

    // load the referenced module, by default searches global scope for module name
    moduleImport: name => new Promise(resolve => self[name] ? resolve(self[name]) : reject(`Module ${name} not found.`)),

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

// public api
export {
    hydrate,
    addPlugin
};