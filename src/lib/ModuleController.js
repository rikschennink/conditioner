/***
 * The ModuleController loads and unloads the contained Module based on the conditions received. It propagates events from the contained Module so you can safely subscribe to them.
 *
 * @exports ModuleController
 * @class
 * @constructor
 * @param {String} path - reference to module
 * @param {Element} element - reference to element
 * @param {(Object|String)=} options - options for this ModuleController
 * @param {Object=} agent - module activation agent
 */
var ModuleController = function ModuleController(path,element,options,agent) {

	// @ifdef DEV
	// if no path supplied, throw error
	if (!path || !element) {
		throw new Error('ModuleController(path,element,options,agent): "path" and "element" are required parameters.');
	}
	// @endif

	// path to module
	this._path = ModuleRegistry.getRedirect(path);
	this._alias = path;

	// reference to element
	this._element = element;

	// options for module controller
	this._options = options;

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
	this._agent.init(function() {
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
	 * Returns the element this module is attached to
	 * @returns {Element}
	 */
	getElement:function() {
		return this._element;
	},

	/***
	 * Returns the module path
	 *
	 * @method getModulePath
	 * @memberof ModuleController
	 * @returns {String}
	 * @public
	 */
	getModulePath:function() {
		return this._path;
	},

	/***
	 * Returns true if the module is currently waiting for load
	 *
	 * @method isModuleAvailable
	 * @memberof ModuleController
	 * @returns {Boolean}
	 * @public
	 */
	isModuleAvailable:function() {
		return this._agent.allowsActivation() && !this._module;
	},

	/***
	 * Returns true if module is currently active and loaded
	 *
	 * @method isModuleActive
	 * @memberof ModuleController
	 * @returns {Boolean}
	 * @public
	 */
	isModuleActive:function() {
		return this._module !== null;
	},

	/***
	 * Checks if it wraps a module with the supplied path
	 *
	 * @method wrapsModuleWithPath
	 * @memberof ModuleController
	 * @param {String} path - Path of module to test for.
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

			// @ifdef DEV
			// if module does not export a module quit here
			if (!Module) {
				throw new Error('ModuleController: A module needs to export an object.');
			}
			// @endif

			// test if not destroyed in the mean time, else stop here
			if (!self._agent) {
				return;
			}

			// set reference to Module
			self._Module = Module;

			// module is now ready to be loaded
			self._onLoad();

		});

	},

	_applyOverrides:function(options,overrides) {

		// test if object is string
		if (typeof overrides === 'string') {

			// test if overrides is JSON string (is first char a '{'
			if (overrides.charCodeAt(0) == 123) {

				// @ifdef DEV
				try {
					// @endif
					overrides = JSON.parse(overrides);
					// @ifdef DEV
				}
				catch(e) {
					throw new Error('ModuleController.load(): "options" is not a valid JSON string.');
				}
				// @endif
			}
			else {

				// no JSON object, must be options string
				var i = 0;
				var opts = overrides.split(', ');
				var l = opts.length;

				for (;i < l;i++) {
					this._overrideObjectWithUri(options,opts[i]);
				}

				return options;
			}

		}

		// directly merge objects
		return mergeObjects(options,overrides);
	},

	/**
	 * Overrides options in the passed object based on the uri string
	 *
	 * number
	 * foo:1
	 *
	 * string
	 * foo.bar:baz
	 *
	 * array
	 * foo.baz:1,2,3
	 *
	 * @param {Object} options - The options to override
	 * @param {String} uri - uri to override the options with
	 * @private
	 */
	_overrideObjectWithUri:function(options,uri) {

		var level = options;
		var prop = '';
		var i = 0;
		var l = uri.length;
		var c;

		while (i < l) {

			c = uri.charCodeAt(i);
			if (c != 46 && c != 58) {
				prop += uri.charAt(i);
			}
			else {

				if (c == 58) {
					level[prop] = this._castValueToType(uri.substr(i + 1));
					break;
				}

				level = level[prop];
				prop = '';
			}
			i++;

		}

	},

	/**
	 * Parses the value and returns it in the right type
	 * @param value
	 * @returns {*}
	 * @private
	 */
	_castValueToType:function(value) {

		// if first character is a single quote
		if (value.charCodeAt(0) == 39) {
			return value.substring(1,value.length - 1);
		}
		// if is a number
		else if (!isNaN(value)) {
			return parseFloat(value);
		}
		// if is boolean
		else if (value == 'true' || value == 'false') {
			return value === 'true';
		}
		// if is an array
		else if (value.indexOf(',') !== -1) {
			return value.split(',').map(this._castValueToType);
		}

		return value;
	},

	/**
	 * Parses options for given url and module also
	 * @param {String} url - url to module
	 * @param {Object} Module - Module definition
	 * @param {(Object|String)} overrides - page level options to override default options with
	 * @returns {Object}
	 * @private
	 */
	_parseOptions:function(url,Module,overrides) {

		var stack = [];
		var pageOptions = {};
		var moduleOptions = {};
		var options;
		var i;

		do {

			// get settings
			options = ModuleRegistry.getModule(url);

			// create a stack of options
			stack.push({
				'page':options,
				'module':Module.options
			});

			// fetch super path, if this module has a super module load that modules options aswell
			url = Module.__superUrl;

			// jshint -W084
		} while (Module = Module.__super);

		// reverse loop over stack and merge all entries to create the final options objects
		i = stack.length;
		while (i--) {
			pageOptions = mergeObjects(pageOptions,stack[i].page);
			moduleOptions = mergeObjects(moduleOptions,stack[i].module);
		}

		// merge page and module options
		options = mergeObjects(moduleOptions,pageOptions);

		// apply overrides
		if (overrides) {
			options = this._applyOverrides(options,overrides);
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

			// is of other type, expect load method to be defined
			this._module = this._Module.load ? this._Module.load(this._element,options) : null;

			// if module not defined we are probably dealing with a static class
			if (!this._module) {
				this._module = this._Module;
			}
		}

		// @ifdef DEV
		// if no module defined throw error
		if (!this._module) {
			throw new Error('ModuleController.load(): could not initialize module, missing constructor or "load" method.');
		}
		// @endif

		// watch for events on target
		// this way it is possible to listen for events on the controller which will always be there
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

		// reset reference to instance
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

		// unbind events
		Observer.unsubscribe(this._agent,'change',this._onAgentStateChangeBind);

		// unload module
		this._unload();

		// call destroy agent
		this._agent.destroy();

		// agent binds
		this._onAgentStateChangeBind = null;
	},

	/***
	 * Executes a methods on the wrapped module.
	 *
	 * @method execute
	 * @memberof ModuleController
	 * @param {String} method - Method name.
	 * @param {Array=} params - Array containing the method parameters.
	 * @return {Object} response - containing return of executed method and a status code
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

		// @ifdef DEV
		if (!F) {
			throw new Error('ModuleController.execute(method,params): function specified in "method" not found on module.');
		}
		// @endif

		// if no params supplied set to empty array,
		// ie8 falls to it's knees when it receives an undefined parameter object in the apply method
		params = params || [];

		// once loaded call method and pass parameters
		return {
			'status':200,
			'response':F.apply(this._module,params)
		};

	}

};