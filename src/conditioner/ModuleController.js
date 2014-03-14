/**
 * @exports ModuleController
 * @class
 * @constructor
 * @param {String} path - reference to module
 * @param {Element} element - reference to element
 * @param {Object} [agent] - module activation agent
 * @param {Object|null} [options] - options for this ModuleController
 */
var ModuleController = function(path,element,agent,options) {

	// if no path supplied, throw error
	if (!path || !element) {
		throw new Error('ModuleController(path,element,agent,options): "path" and "element" are required parameters.');
	}

	// path to module
	this._path = ModuleRegistry.getRedirect(path);
    this._alias = path;

	// reference to element
	this._element = element;

	// options for module controller
	this._options = options || {};

    // set loader
    this._agent = agent || StaticModuleAgent;

    // module definition reference
    this._Module = null;

    // module instance reference
    this._module = null;

    // let's see if the behavior allows immediate activation
    if (this._agent.allowsActivation()) {
        this._initialize();
    }
    // wait for ready state on behavior
    else {
        Observer.subscribe(this._agent,'ready',this._onAgentReady.bind(this));
    }

};

ModuleController.prototype = {

    /**
     * Returns true if the module is available for initialisation, this is true when conditions have been met.
     * This does not mean the module is active, it means the module is ready and suitable for activation.
     * @return {Boolean}
     * @public
     isModuleAvailable:function() {

        this._behavior.isAvailable();

        if (this._conditionsManager) {
            this._available = this._conditionsManager.getSuitability();
        }

		return this._available;
	},
     */

    /**
     * Returns true if the module requires certain conditions to be met
     * @return {Boolean}
     * @public
     isModuleConditioned:function() {
		return typeof this._options.conditions !== 'undefined';
	},
     */

    /**
     * Returns true if the module controller has finished the initialization process,
     * this is true when conditions have been read for the first time (and have been deemed suitable)
     * or no conditions have been set
     * @return {Boolean}
     * @public
     hasInitialized:function() {
		return this._initialized;
	},
     */

    /**
     * Returns the module path
     * @returns {String}
     * @public
     */
    getModulePath:function() {
        return this._path;
    },

	/**
	 * Returns true if module is currently active and loaded
	 * @returns {Boolean}
	 * @public
	 */
	isModuleActive:function() {
		return this._module !== null;
	},

    /**
     * Checks if it wraps a module with the supplied path
     * @param {String} path - path of module to test for
     * @return {Boolean}
     * @public
     */
    wrapsModuleWithPath:function(path) {
        return this._path === path || this._alias === path;
    },

	/**
     * Called when the module behavior has initialized
	 * @private
	 */
	_onAgentReady:function() {

		// module has now completed the initialization process (this does not mean it's available)
        this._initialize();

	},

    /**
     * Called to initialize the module
     * @private
     * @fires ready
     */
    _initialize:function() {

        // listen to behavior changes
        Observer.subscribe(this._agent,'change',this._onAgentStateChange.bind(this));

        // let others know we have initialized
        Observer.publish(this,'init',this);

        // if activation is allowed, we are directly available
        if (this._agent.allowsActivation()) {
            this._onBecameAvailable();
        }
    },

	/**
     * Called when the module became available, this is when it's suitable for load
	 * @private
	 * @fires available
	 */
	_onBecameAvailable:function() {

        // we are now available
        Observer.publish(this,'available',this);

		// let's load the module
        this._load();

	},

	/**
	 * Called when the agent state changes
	 * @private
	 */
    _onAgentStateChange:function() {

        // check if module is available
        var shouldLoadModule = this._agent.allowsActivation();

        // determine what action to take basted on availability of module
		if (this._module && !shouldLoadModule) {
			this._unload();
		}
		else if (!this._module && shouldLoadModule) {
			this._onBecameAvailable();
		}

	},

	/**
	 * Load the module contained in this ModuleController
	 * @public
	 */
	_load:function() {

		// if module available no need to require it
		if (this._Module) {
			this._onLoad();
			return;
		}

		// load module, and remember reference
		var self = this;
		require([this._path],function(Module) {

			// set reference to Module
			self._Module = Module;

			// module is now ready to be loaded
			self._onLoad();

		});

	},

    _parseOptionOverrides:function(options) {
        if (typeof options === 'string') {
            try {
                return JSON.parse(options);
            }
            catch(e) {
                throw new Error('ModuleController.load(): "options" is not a valid JSON string.');
            }
        }
        return options;
    },

    _parseOptions:function(url,Module,overrides) {

        var stack = [],pageOptions = {},moduleOptions = {},options,i;
        do {

            // get settings
            options = ModuleRegistry.getModule(url);

            // stack the options
            stack.push({
                'page':options,
                'module':Module.options
            });

            // fetch super path
            url = Module.__superUrl;

        } while (Module = Module.__super);

        // reverse loop over stack and merge options
        i = stack.length;
        while (i--) {
            pageOptions = mergeObjects(pageOptions,stack[i].page);
            moduleOptions = mergeObjects(moduleOptions,stack[i].module);
        }

        // merge page and module options
        options = mergeObjects(moduleOptions,pageOptions);

        // apply overrides
        if (overrides) {
            options = mergeObjects(options,this._parseOptionOverrides(overrides));
        }

        return options;
    },

	/**
	 * Method called when module loaded
	 * @fires load
	 * @private
	 */
	_onLoad:function() {

		// if activation is no longer allowed, stop here
        if (!this._agent.allowsActivation()) {
			return;
		}

        // parse and merge options for this module
        var options = this._parseOptions(this._path,this._Module,this._options.options);

		// set reference
		if (typeof this._Module === 'function') {

			// is of function type so try to create instance
			this._module = new this._Module(this._element,options);
		}
		else {

			// is of other type so expect load method to be defined
			this._module = this._Module.load ? this._Module.load(this._element,options) : null;

			// if module not defined we could be dealing with a static class
			if (typeof this._module === 'undefined') {
				this._module = this._Module;
			}
		}

		// if no module defined throw error
		if (!this._module) {
			throw new Error('ModuleController.load(): could not initialize module, missing constructor or "load" method.');
		}

        // watch for events on target
        // this way it is possible to listen to events on the controller which is always there
        Observer.inform(this._module,this);

        // publish load event
        Observer.publish(this,'load',this);
	},


	/**
	 * Unloads the wrapped module
	 * @fires unload
	 * @return {Boolean}
	 */
	_unload:function() {

		// module is now no longer ready to be loaded
		this._available = false;

		// if no module, module has already been unloaded or was never loaded
		if (!this._module) {
			return false;
		}

		// stop watching target
		Observer.conceal(this._module,this);

		// unload module if possible
		if (this._module.unload) {
			this._module.unload();
		}

        // reset property
        this._module = null;

        // publish unload event
        Observer.publish(this,'unload',this);

		return true;
	},

    /**
     * Cleans up the module and module controller and all bound events
     * @public
     */
    destroy:function() {

        // todo: implement destroy method

        // - unload module

        // - unbind events

        // - remove events from module behavior

        // - call destroy on module behavior

    },

	/**
	 * Executes a methods on the wrapped module
	 * @param {String} method - method key
	 * @param {Array} [params] - optional array containing the method parameters
	 * @return {Object} containing response of executed method and a status code
	 * @public
	 */
	execute:function(method,params) {

		// if module not loaded
		if (!this._module) {
			return {
				'status':404,
				'response':null
			};
		}

		// get function reference
		var F = this._module[method];
		if (!F) {
			throw new Error('ModuleController.execute(method,params): function specified in "method" not found on module.');
		}

		// if no params supplied set to empty array,
		// ie8 falls on it's knees when it gets an undefined parameter object in the apply method
		params = params || [];

		// once loaded call method and pass parameters
		return {
			'status':200,
			'response':F.apply(this._module,params)
		};

	}

};