// links the module to the element and exposes a callback api object
const bindModule = element => {

    const alias = runPlugin('moduleGetName', element);

    const name = chainPlugins('moduleSetName', alias);

    const state = {
        destroy: null // holder for unload method
    };

    // module config
    const boundModule = {

        alias,

        // module name
        name,

        // reference to the element
        element,

        // is the module currently mounted?
        mounted: false,

        // unload is empty function so we can blindly call it if initial context does not match
        unmount: () => {

            // can't be destroyed as no destroy method has been supplied
            if (!state.destroy) { return; }

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

            // about to mount the module
            eachPlugins('moduleWillMount', boundModule);

            // get the module
            runPlugin('moduleImport', name)
                .catch( error => {

                    // failed to mount the module
                    eachPlugins('moduleDidCatch', error, boundModule);
                    
                    // callback for this specific module
                    boundModule.onmounterror.apply(element, [error, boundModule]);

                    // log silently to console
                    console.warn(error);

                })
                .then( module => {

                    // initialise the module, module can return a destroy mehod ()
                    state.destroy = runPlugin('moduleGetDestructor', runPlugin('moduleGetConstructor', module)( ...runPlugin('moduleSetConstructorArguments', name, element, module) ) );
                    
                    // module is now mounted
                    boundModule.mounted = true;

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

// @media (min-width:30em) and @visible true  ->  ['media', '(min-width:30em)'], ['visible', 'true']
const parseQuery = query => query.substr(1).split(' and @').map(q => /^([a-z]+) (.+)/.exec(q).splice(1));

// returns a context monitor from the plugins array
const getContextMonitor = (name, context, element) => {
    const monitors = getPlugins('monitor');
    const monitor = monitors.find(monitor => monitor.name === name);
    return monitor.create(context, element);
};

// handles contextual loading and unloading
const createContextualModule = (query, boundModule) => {
    
    // get monitors for supplied query
    const monitors = parseQuery(query).map(params => getContextMonitor(...params, boundModule.element));

    // if all monitors return true for .matches getter, we mount the module
    const onchange = () => {

    // will keep returning false if one of the monitors does not match, else checks matches property
    const matches = monitors.reduce((matches, monitor) => {
        return matches ? monitor.matches : false;
    }, true);

    // if matches we mount the module, else we unmount
    matches ? boundModule.mount() : boundModule.unmount();
    }
    
    // listen for context changes
    monitors.forEach(monitor => monitor.addListener(onchange));

    // test if is currently matching
    onchange();

    return boundModule;
};


// creates modules.. you don't say!?
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
const addPlugin = plugin => plugins.push(plugin);
const getPlugins = type => plugins.filter( plugin => Object.keys(plugin).includes(type) ).map( plugin => plugin[type] )
const eachPlugins = (type, ...args) => getPlugins(type).forEach(plugin => plugin(...args));
const chainPlugins = (type, ...args) => getPlugins(type).reduce((args, plugin) => [plugin(...args)], args).shift();
const runPlugin = (type, ...args) => getPlugins(type).pop()(...args);


// default plugin
addPlugin({

    // select all elements that have modules assigned to them
    moduleSelector: context => context.querySelectorAll('[data-module]'),

    // returns the context query as defined on the element
    moduleGetContext: element => element.dataset.context,

    // load the referenced module, by default searches global scope for module name
    moduleImport: name => new Promise(resolve => resolve(self[name])),

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