/**
 * @exports ModuleController
 * @class
 * @constructor
 * @param {String} path - reference to module
 * @param {Element} element - reference to element
 * @param {Object} [options] - options for this ModuleController
 */
var ModuleController = function(path,element,options) {

	// if no path supplied, throw error
	if (!path || !element) {
		throw new Error('ModuleController(path,element,options): "path" and "element" are required parameters.');
	}

	// path to module
	this._path = ModuleRegistry.getRedirect(path);
    this._alias = path;

	// reference to element
	this._element = element;

	// options for module controller
	this._options = options || {};

	// module reference
	this._Module = null;

	// module instance reference
	this._module = null;

	// check if conditions specified
	this._conditionsManager = new ConditionsManager(
		this._options.conditions,
		this._element
	);

	// listen to ready event on condition manager
	Observer.subscribe(this._conditionsManager,'ready',this._onInitialized.bind(this));

	// by default the module controller has not yet initialized and is not available
	// unless the contained module is not conditioned or conditions are already suitable
	this._initialized = !this.isModuleConditioned() || this._conditionsManager.getSuitability();

	// not available at this moment
	this._available = false;
};

ModuleController.prototype = {

	/**
	 * Returns true if the module is available for initialisation, this is true when conditions have been met.
	 * This does not mean the module is active, it means the module is ready and suitable for activation.
	 * @return {Boolean}
	 * @public
	 */
	isModuleAvailable:function() {
		this._available = this._conditionsManager.getSuitability();
		return this._available;
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
	 * Returns true if the module requires certain conditions to be met
	 * @return {Boolean}
	 * @public
	 */
	isModuleConditioned:function() {
		return typeof this._options.conditions !== 'undefined';
	},

	/**
	 * Returns true if the module controller has finished the initialization process,
	 * this is true when conditions have been read for the first time (and have been deemed suitable)
	 * or no conditions have been set
	 * @return {Boolean}
	 * @public
	 */
	hasInitialized:function() {
		return this._initialized;
	},

	/**
	 * Checks if the module matches the supplied path
	 * @param {String} path - path of module to test for
	 * @return {Boolean}
	 * @public
	 */
	matchesPath:function(path) {
		return this._path === path || this._alias === path;
	},

	/**
	 * @private
	 * @param {Boolean} suitable
	 * @fires ready
	 */
	_onInitialized:function(suitable) {

		// module has now completed the initialization process (this does not mean it's available)
		this._initialized = true;

		// listen to changes in conditions
		Observer.subscribe(this._conditionsManager,'change',this._onConditionsChange.bind(this));

		// let others know we have initialized
		Observer.publish(this,'init',this);

		// are we available
		if (suitable) {
			this._onBecameAvailable();
		}

	},

	/**
	 * @private
	 * @fires available
	 */
	_onBecameAvailable:function() {

		// module is now available
		this._available = true;

		// let other know we are available
		Observer.publish(this,'available',this);

	},

	/**
	 * Called when the conditions change
	 * @private
	 */
	_onConditionsChange:function() {

		var suitable = this._conditionsManager.getSuitability();

		if (this._module && !suitable) {
			this.unload();
		}

		if (!this._module && suitable) {
			this._onBecameAvailable();
		}

	},

	/**
	 * Load the module contained in this ModuleController
	 * @public
	 */
	load:function() {

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

        var stack = [],options,i,pageOptions = {},moduleOptions = {};

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

		// if no longer available for loading stop here
		if (!this.isModuleAvailable()) {
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

			// if module not defined we are probably dealing with a static class
			if (typeof this._module === 'undefined') {
				this._module = this._Module;
			}
		}

		// if no module defined throw error
		if (!this._module) {
			throw new Error('ModuleController.load(): could not initialize module, missing constructor or "load" method.');
		}

		// set initialized attribute to initialized module
		this._element.setAttribute('data-initialized',this._path);

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
	 * @public
	 */
	unload:function() {

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

		// remove initialized attribute
		this._element.removeAttribute('data-initialized');

		// reset property
		this._module = null;

		// publish unload event
		Observer.publish(this,'unload',this);

		return true;
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