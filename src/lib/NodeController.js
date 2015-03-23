var NodeController = (function() {

	var _filterIsActiveModule = function(item) {return item.isModuleActive();};
	var _filterIsAvailableModule = function(item) {return item.isModuleAvailable();};
	var _mapModuleToPath = function(item) {return item.getModulePath();};

	/***
	 * For each element found having a `data-module` attribute an object of type NodeController is made. The node object can then be queried for the [ModuleControllers](#modulecontroller) it contains.
	 *
	 * @exports NodeController
	 * @class
	 * @constructor
	 * @param {Object} element
	 * @param {Number} priority
	 */
	var exports = function NodeController(element,priority) {

		// @ifdef DEV
		if (!element) {
			throw new Error('NodeController(element): "element" is a required parameter.');
		}
		// @endif

		// set element reference
		this._element = element;

		// has been processed
		this._element.setAttribute(_options.attr.processed,'true');

		// set priority
		this._priority = !priority ? 0 : parseInt(priority,10);

		// contains references to all module controllers
		this._moduleControllers = [];

		// binds
		this._moduleAvailableBind = this._onModuleAvailable.bind(this);
		this._moduleLoadBind = this._onModuleLoad.bind(this);
		this._moduleUnloadBind = this._onModuleUnload.bind(this);

	};

	/**
	 * Static method testing if the current element has been processed already
	 * @param {Element} element
	 * @static
	 */
	exports.hasProcessed = function(element) {
		return element.getAttribute(_options.attr.processed) === 'true';
	};

	exports.prototype = {

		/**
		 * Loads the passed ModuleControllers to the node
		 * @param {Array} moduleControllers
		 * @public
		 */
		load:function(moduleControllers) {

			// if no module controllers found, fail silently
			if (!moduleControllers || !moduleControllers.length) {
				return;
			}

			// turn into array
			this._moduleControllers = moduleControllers;

			// listen to load events on module controllers
			var i = 0;
			var l = this._moduleControllers.length;
			var mc;

			for (;i < l;i++) {
				mc = this._moduleControllers[i];
				Observer.subscribe(mc,'available',this._moduleAvailableBind);
				Observer.subscribe(mc,'load',this._moduleLoadBind);
			}

		},

		/**
		 * Unload all attached modules and restore node in original state
		 * @public
		 */
		destroy:function() {

			var i = 0;
			var l = this._moduleControllers.length;

			for (;i < l;i++) {
				this._destroyModule(this._moduleControllers[i]);
			}

			// clear binds
			this._moduleAvailableBind = null;
			this._moduleLoadBind = null;
			this._moduleUnloadBind = null;

			// update initialized state
			this._updateAttribute(_options.attr.initialized,this._moduleControllers);

			// reset array
			this._moduleControllers = null;

			// reset processed state
			this._element.removeAttribute(_options.attr.processed);

		},

		/**
		 * Call destroy method on module controller and clean up listeners
		 * @param moduleController
		 * @private
		 */
		_destroyModule:function(moduleController) {

			// unsubscribe from module events
			Observer.unsubscribe(moduleController,'available',this._moduleAvailableBind);
			Observer.unsubscribe(moduleController,'load',this._moduleLoadBind);
			Observer.unsubscribe(moduleController,'unload',this._moduleUnloadBind);

			// conceal events from module controller
			Observer.conceal(moduleController,this);

			// unload the controller
			moduleController.destroy();

		},

		/**
		 * Returns the set priority for this node
		 * @public
		 */
		getPriority:function() {
			return this._priority;
		},

		/***
		 * Returns the element linked to this node
		 *
		 * @method getElement
		 * @memberof NodeController
		 * @returns {Element} element - A reference to the element wrapped by this NodeController
		 * @public
		 */
		getElement:function() {
			return this._element;
		},

		/***
		 * Tests if the element contained in the NodeController object matches the supplied CSS selector.
		 *
		 * @method matchesSelector
		 * @memberof NodeController
		 * @param {String} selector - CSS selector to match element to.
		 * @param {Element=} context - Context to search in.
		 * @return {Boolean} match - Result of matchs
		 * @public
		 */
		matchesSelector:function(selector,context) {

			if (!selector && context) {
				return contains(context,this._element);
			}

			if (context && !contains(context,this._element)) {
				return false;
			}

			return matchesSelector(this._element,selector);
		},

		/***
		 * Returns true if all [ModuleControllers](#modulecontroller) are active
		 *
		 * @method areAllModulesActive
		 * @memberof NodeController
		 * @returns {Boolean} state - All modules loaded state
		 * @public
		 */
		areAllModulesActive:function() {
			return this.getActiveModules().length === this._moduleControllers.length;
		},

		/***
		 * Returns an array containing all active [ModuleControllers](#modulecontroller)
		 *
		 * @method getActiveModules
		 * @memberof NodeController
		 * @returns {Array} modules - An Array of active ModuleControllers
		 * @public
		 */
		getActiveModules:function() {
			return this._moduleControllers.filter(_filterIsActiveModule);
		},

		/***
		 * Returns the first [ModuleController](#modulecontroller) matching the given path
		 *
		 * @method getModule
		 * @memberof NodeController
		 * @param {String=} path - The module id to search for.
		 * @returns {(ModuleController|null)} module - A [ModuleController](#modulecontroller) or null if none found
		 * @public
		 */
		getModule:function(path) {
			return this._getModules(path,true);
		},

		/***
		 * Returns an Array of [ModuleControllers](#modulecontroller) matching the given path
		 *
		 * @method getModules
		 * @memberof NodeController
		 * @param {String=} path - The module id to search for.
		 * @returns {Array} modules - An Array of [ModuleControllers](#modulecontroller)
		 * @public
		 */
		getModules:function(path) {
			return this._getModules(path);
		},

		/**
		 * Returns one or multiple [ModuleControllers](#modulecontroller) matching the supplied path
		 *
		 * @param {String=} path - Path to match the nodes to
		 * @param {Boolean=} singleResult - Boolean to only ask for one result
		 * @returns {(Array|ModuleController|null)}
		 * @private
		 */
		_getModules:function(path,singleResult) {

			// if no path supplied return all module controllers (or one if single result mode)
			if (typeof path === 'undefined') {
				if (singleResult) {
					return this._moduleControllers[0];
				}
				return this._moduleControllers.concat();
			}

			// loop over module controllers matching the path, if single result is enabled, return on first hit, else collect
			var i = 0;
			var l = this._moduleControllers.length;
			var results = [];
			var mc;

			for (;i < l;i++) {
				mc = this._moduleControllers[i];
				if (!mc.wrapsModuleWithPath(path)) {
					continue;
				}
				if (singleResult) {
					return mc;
				}
				results.push(mc);
			}
			return singleResult ? null : results;
		},

		/***
		 * Safely tries to executes a method on the currently active Module. Always returns an object containing a status code and a response data property.
		 *
		 * @method execute
		 * @memberof NodeController
		 * @param {String} method - Method name.
		 * @param {Array=} params - Array containing the method parameters.
		 * @returns {Array} results - An object containing status code and possible response data.
		 * @public
		 */
		execute:function(method,params) {
			return this._moduleControllers.map(function(item) {
				return {
					controller:item,
					result:item.execute(method,params)
				};
			});
		},

		/**
		 * Called when a module becomes available for load
		 * @param moduleController
		 * @private
		 */
		_onModuleAvailable:function(moduleController) {

			// propagate events from the module controller to the node so people can subscribe to events on the node
			Observer.inform(moduleController,this);

			// update loading attribute with currently loading module controllers list
			this._updateAttribute(_options.attr.loading,this._moduleControllers.filter(_filterIsAvailableModule));
		},

		/**
		 * Called when module has loaded
		 * @param moduleController
		 * @private
		 */
		_onModuleLoad:function(moduleController) {

			// listen to unload event
			Observer.unsubscribe(moduleController,'load',this._moduleLoadBind);
			Observer.subscribe(moduleController,'unload',this._moduleUnloadBind);

			// update loading attribute with currently loading module controllers list
			this._updateAttribute(_options.attr.loading,this._moduleControllers.filter(_filterIsAvailableModule));

			// update initialized attribute with currently active module controllers list
			this._updateAttribute(_options.attr.initialized,this.getActiveModules());
		},

		/**
		 * Called when module has unloaded
		 * @param moduleController
		 * @private
		 */
		_onModuleUnload:function(moduleController) {

			// stop listening to unload
			Observer.subscribe(moduleController,'load',this._moduleLoadBind);
			Observer.unsubscribe(moduleController,'unload',this._moduleUnloadBind);

			// conceal events from module controller
			Observer.conceal(moduleController,this);

			// update initialized attribute with now active module controllers list
			this._updateAttribute(_options.attr.initialized,this.getActiveModules());

		},

		/**
		 * Updates the given attribute with paths of the supplied controllers
		 * @private
		 */
		_updateAttribute:function(attr,controllers) {

			var modules = controllers.map(_mapModuleToPath);
			if (modules.length) {
				this._element.setAttribute(attr,modules.join(','));
			}
			else {
				this._element.removeAttribute(attr);
			}

		}

	};

	return exports;

}());