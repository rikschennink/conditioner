/**
 * @exports Node
 * @class
 * @constructor
 * @param {Element} element
 */
var Node = function(element) {

	if (!element) {
		throw new Error('Node: "element" is a required parameter.');
	}

	// set element reference
	this._element = element;

	// has been processed
	this._element.setAttribute('data-processed','true');

	// set priority
	var prio = this._element.getAttribute('data-priority');
	this._priority = !prio ? 0 : parseInt(prio,10);

	// contains references to all module adapters
	this._moduleControllers = [];

	// contains reference to currently active module adapter
	this._activeModuleController = null;

	// method to unbind
	this._activeModuleUnloadBind = this._onActiveModuleUnload.bind(this);

};

/**
 * Static method testing if the current element has been processed already
 * @param {Element} element
 * @static
 */
Node.hasProcessed = function(element) {
	return element.getAttribute('data-processed') === 'true';
};

Node.prototype = {

	/**
	 * Initializes the node
	 * @public
	 */
	init:function() {

		// parse element module attributes
		this._moduleControllers = this._wrapModuleControllers();

		// initialize
		var i=0,l=this._moduleControllers.length,mc;

		// if no module adapters found
		if (!l) {
			throw new Error('Node: "element" has to have a "data-module" attribute containing a reference to a Module.');
		}

		// listen to init events on module adapters
		for (;i<l;i++) {

			mc = this._moduleControllers[i];

			// if module already has initialized, jump to _onModuleInitialized method and don't bind listener
			if (mc.hasInitialized()) {
				this._onModuleInitialized();
				continue;
			}

			// otherwise, listen to init event
			Observer.subscribe(mc,'init',this._onModuleInitialized.bind(this));
		}
	},

	/**
	 * Returns the set priority for this node
	 * @public
	 */
	getPriority:function() {
		return this._priority;
	},

	/**
	 * Public method to check if the module matches the given query
	 * @param {String} selector - CSS selector to match module to
	 * @param {Document|Element} [context] - Context to search in
	 * @return {Boolean}
	 * @public
	 */
	matchesSelector:function(selector,context) {

		if (context && !Utils.isDescendant(this._element,context)) {
			return false;
		}

		return Utils.matchesSelector(this._element,selector,context);
	},

	/**
	 * Returns a reference to the currently active module adapter
	 * @return {ModuleController|null}
	 * @public
	 */
	getActiveModuleController:function() {
		return this._activeModuleController;
	},

	/**
	 * Returns the first ModuleController matching the given path
	 * @param {String} [path] to module
	 * @return {ModuleController|null}
	 * @public
	 */
	getModuleController:function(path) {
		return this._getModuleControllers(path,true);
	},

	/**
	 * Returns an array of ModuleControllers matching the given path
	 * @param {String} [path] to module
	 * @return {Array}
	 * @public
	 */
	getModuleControllers:function(path) {
		return this._getModuleControllers(path);
	},

	/**
	 * Returns one or multiple ModuleControllers matching the supplied path
	 * @param {String} [path] - Optional path to match the nodes to
	 * @param {Boolean} [singleResult] - Optional boolean to only ask one result
	 * @returns {Array|ModuleController|null}
	 * @private
	 */
	_getModuleControllers:function(path,singleResult) {

		if (typeof path === 'undefined') {
			if (singleResult) {
				return this._moduleControllers[0];
			}
			return this._moduleControllers.concat();
		}

		var i=0,l=this._moduleControllers.length,results=[],mc;
		for (;i<l;i++) {
			mc = this._moduleControllers[i];
			if (mc.matchesPath(path)) {
				if (singleResult) {
					return mc;
				}
				results.push(mc);
			}
		}
		return singleResult ? null : results;
	},

	/**
	 * Public method for safely executing methods on the loaded module
	 * @param {String} method - method key
	 * @param {Array} [params] - array containing the method parameters
	 * @return {Object} returns object containing status code and possible response data
	 * @public
	 */
	execute:function(method,params) {

		// if active module adapter defined
		if (this._activeModuleController) {
			return this._activeModuleController.execute(method,params);
		}

		// no active module
		return {
			'status':404,
			'response':null
		};
	},

	/**
	 * Called when a module has indicated it's initialization is done
	 * @private
	 */
	_onModuleInitialized:function() {

		var i=this._moduleControllers.length;

		// check if all modules have initialized, if so move on to the next init stage
		while (--i >= 0) {
			if (!this._moduleControllers[i].hasInitialized()) {
				return;
			}
		}

		this._onModulesInitialized();

	},

	/**
	 * Called when all modules have been initialized
	 * @private
	 */
	_onModulesInitialized:function() {

		// find suitable active module adapter
		var ModuleController = this._getSuitableActiveModuleController();
		if (ModuleController) {
			this._setActiveModuleController(ModuleController);
		}

		// listen to available events on adapters
		var i=0,l=this._moduleControllers.length;
		for (;i<l;i++) {
			Observer.subscribe(this._moduleControllers[i],'available',this._onModuleAvailable.bind(this));
		}

	},

	/**
	 * Called when a module adapter has indicated it is ready to be loaded
	 * @param ModuleController
	 * @private
	 */
	_onModuleAvailable:function(ModuleController) {

		// setup vars
		var i=0,l=this._moduleControllers.length,mc;

		for (;i<l;i++) {

			mc = this._moduleControllers[i];

			if (mc !== ModuleController &&
				mc.isModuleAvailable() &&
				mc.isModuleConditioned()) {

				// earlier or conditioned module is ready, therefor cannot load this module

				return;
			}
		}

		// load supplied module adapter as active module
		this._setActiveModuleController(ModuleController);

	},

	/**
	 * Sets the active module adapter
	 * @param ModuleController
	 * @private
	 */
	_setActiveModuleController:function(ModuleController) {

		// if not already loaded
		if (ModuleController === this._activeModuleController) {
			return;
		}

		// clean up active module adapter reference
		this._cleanActiveModuleController();

		// set new active module adapter
		this._activeModuleController = ModuleController;

		// listen to unload event so we can load another module if necessary
		Observer.subscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);

		// propagate events from the module adapter to the node so people can subscribe to events on the node
		Observer.inform(this._activeModuleController,this);

		// finally load the module adapter
		this._activeModuleController.load();

	},

	/**
	 * Removes the active module adapter
	 * @private
	 */
	_cleanActiveModuleController:function() {

		// if no module adapter defined do nothing
		if (!this._activeModuleController) {
			return;
		}

		// stop listening to unload
		Observer.unsubscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);

		// conceal events from active module adapter
		Observer.conceal(this._activeModuleController,this);

		// unload adapter
		this._activeModuleController.unload();

		// remove reference
		this._activeModuleController = null;
	},

	/**
	 * Called when active module unloaded
	 * @private
	 */
	_onActiveModuleUnload:function() {

		// clean up active module adapter reference
		this._cleanActiveModuleController();

		// active module was unloaded, find another active module
		var ModuleController = this._getSuitableActiveModuleController();
		if(!ModuleController) {
			return;
		}

		// set found module adapter as new active module adapter
		this._setActiveModuleController(ModuleController);
	},

	/**
	 * Returns a suitable module adapter
	 * @returns {null|ModuleController}
	 * @private
	 */
	_getSuitableActiveModuleController:function() {

		// test if other module is ready, if so load first module to be fitting
		var i=0,l=this._moduleControllers.length,mc;
		for (;i<l;i++) {

			mc = this._moduleControllers[i];

			// if not ready, skip to next adapter
			if (!mc.isModuleAvailable()) {
				continue;
			}

			return mc;
		}

		return null;
	},

	/**
	 * Returns an array of module adapters found specified on the element
	 * @returns {Array}
	 * @private
	 */
	_wrapModuleControllers:function() {

		var result = [],
			config = this._element.getAttribute('data-module') || '',
			advanced = config.charAt(0) === '[';

		if (advanced) {

			var specs;

			// add multiple module adapters
			try {
				specs = JSON.parse(config);
			}
			catch(e) {
				// failed parsing spec
				throw new Error('Node: "data-module" attribute containing a malformed JSON string.');
			}

			// no specification found or specification parsing failed
			if (!specs) {
				return [];
			}

			// setup vars
			var l=specs.length,i=0,spec;

			// create specs
			for (;i<l;i++) {

				spec = specs[i];

				result.push(
					new ModuleController(spec.path,this._element,{
						'conditions':spec.conditions,
						'options':spec.options
					})
				);

			}


		}
		else if (config.length) {

			// add default module adapter
			result.push(
				new ModuleController(config,this._element,{
					'conditions':this._element.getAttribute('data-conditions'),
					'options':this._element.getAttribute('data-options')
				})
			);

		}

		return result;

	}

};