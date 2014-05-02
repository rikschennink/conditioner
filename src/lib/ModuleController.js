/**
 * @exports ModuleController
 * @class
 * @constructor
 * @param {String} path - reference to module
 * @param {Element} element - reference to element
 * @param {Object|null} [options] - options for this ModuleController
 * @param {Object} [agent] - module activation agent
 */
var ModuleController = function(path,element,options,agent) {

	// if no path supplied, throw error
	if (!path || !element) {
		throw new Error('ModuleController(path,element,options,agent): "path" and "element" are required parameters.');
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

    // default init state
    this._initialized = false;

    // agent binds
    this._onAgentStateChangeBind = this._onAgentStateChange.bind(this);

    // wait for init to complete
    var self = this;
    this._agent.init(function(){
        self._initialize();
    });

};

ModuleController.prototype = {

    /**
     * returns true if the module controller has initialized
     * @returns {Boolean}
     */
    hasInitialized:function() {
        return this._initialized;
    },

    /**
     * Returns the module path
     * @returns {String}
     * @public
     */
    getModulePath:function() {
        return this._path;
    },

    /**
     * Returns true if the module is currently waiting for load
     * @returns {Boolean}
     * @public
     */
    isModuleAvailable:function() {
        return this._agent.allowsActivation() && !this._module;
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
     * Called to initialize the module
     * @private
     * @fires init
     */
    _initialize:function() {

        // now in initialized state
        this._initialized = true;

        // listen to behavior changes
        Observer.subscribe(this._agent,'change',this._onAgentStateChangeBind);

        // let others know we have initialized
        Observer.publishAsync(this,'init',this);

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
        Observer.publishAsync(this,'available',this);

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
        _options.loader.require([this._path],function(Module) {

            // if module does not export a module quit here
            if (!Module) {
                throw new Error('ModuleController: A module needs to export an object.');
            }

			// set reference to Module
			self._Module = Module;

			// module is now ready to be loaded
			self._onLoad();

		});

	},

    /**
     * Turns possible options string into options object
     * @param {String|Object} options
     * @returns {Object}
     * @private
     */
    _optionsToObject:function(options) {
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

    /**
     * Parses options for given url and module also
     * @param {String} url - url to module
     * @param {Object} Module - Module definition
     * @param {Object|String} overrides - page level options to override default options with
     * @returns {Object}
     * @private
     */
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

            // jshint -W084
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
            options = mergeObjects(options,this._optionsToObject(overrides));
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
        var options = this._parseOptions(this._path,this._Module,this._options);

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
        Observer.publishAsync(this,'load',this);
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
        Observer.publishAsync(this,'unload',this);

		return true;
	},

    /**
     * Cleans up the module and module controller and all bound events
     * @public
     */
    destroy:function() {

        // unload module
        this._unload();

        // unbind events
        Observer.unsubscribe(this._agent,'ready',this._onAgentReadyBind);
        Observer.unsubscribe(this._agent,'change',this._onAgentStateChangeBind);

        // call destroy on agent
        this._agent.destroy();

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