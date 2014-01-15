/**
 * @exports NodeController
 * @class
 * @constructor
 * @param {Object} element
 * @param {Number} priority
 */
var NodeController = function(element) {

	if (!element) {
		throw new Error('NodeController(element): "element" is a required parameter.');
	}

	// set element reference
	this._element = element;

	// has been processed
	this._element.setAttribute('data-processed','true');

	// set priority
    var prio = element.getAttribute('data-priority');
	this._priority = !prio ? 0 : parseInt(prio,10);

	// contains references to all module controllers
	this._moduleControllers = [];

	// contains reference to currently active module controller
	//this._activeModuleController = null;

	// method to unbind
	//this._activeModuleUnloadBind = this._onActiveModuleUnload.bind(this);

};

/**
 * Static method testing if the current element has been processed already
 * @param {Element} element
 * @static
 */
NodeController.hasProcessed = function(element) {
	return element.getAttribute('data-processed') === 'true';
};

NodeController.prototype = {

	/**
	 * Loads the passed module controllers to the node
     * @param {arguments}
	 * @public
	 */
	load:function() {

        // if no module controllers found
        if (!arguments || !arguments.length) {
            throw new Error('NodeController.load(controllers): Expects an array of module controllers as parameters.');
        }

		// parse element module attributes
        this._moduleControllers = Array.prototype.slice.call(arguments,0);

		// initialize
		var i=0,l=this._moduleControllers.length,mc;

		// listen load events on module controllers
		for (;i<l;i++) {

			mc = this._moduleControllers[i];

            // listen to load and unload event
			Observer.subscribe(mc,'load',this._onModuleLoad.bind(this));
            Observer.subscribe(mc,'unload',this._onModuleUnload.bind(this));

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
	 * Returns the element linked to this node
	 * @public
	 */
	getElement:function() {
		return this._element;
	},

	/**
	 * Public method to check if the module matches the given query
	 * @param {String} selector - CSS selector to match module to
	 * @param {Document|Element} [context] - Context to search in
	 * @return {Boolean}
	 * @public
	 */
	matchesSelector:function(selector,context) {

		if (context && !contains(context,this._element)) {
			return false;
		}

		return matchesSelector(this._element,selector,context);
	},

	/**
	 * Returns true if all module controllers are active
	 * @public
	 */
    areModulesActive:function() {
        return this.getActiveModuleControllers().length === this._moduleControllers.length;
    },

	/**
	 * Returns a reference to the currently active module controller
	 * @return {Array}
	 * @public
	 */
	getActiveModuleControllers:function() {

        var i=0,l=this._moduleControllers.length,controller,results = [];
        for (;i<l;i++) {
            controller = this._moduleControllers[i];
            if (controller.isModuleActive()) {
                results.push(controller);
            }
        }
        return results;

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
	 * @return [Array] returns object containing status code and possible response data
	 * @public
	 */
	execute:function(method,params) {

        var i=0,l=this._moduleControllers.length,controller,results = [];
        for (;i<l;i++) {
            controller = this._moduleControllers[i];
            results.push({
                controller:controller,
                result:controller.execute(method,params)
            });
        }
        return results;

	},

	/**
	 * Called when a module has indicated it's initialization is done
	 * @private
	 */
        /*
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
	*/

	/**
	 * Called when all modules have been initialized
	 * @private
	 */
    /*
     _onModulesInitialized:function() {

		// find suitable active module controller
        var ModuleController = this._getSuitableActiveModuleController();
		if (ModuleController) {
			this._setActiveModuleController(ModuleController);
		}

		// listen to available events on controllers
		var i=0,l=this._moduleControllers.length;
		for (;i<l;i++) {
            Observer.subscribe(this._moduleControllers[i],'available',this._onModuleAvailable.bind(this));
		}

	},*/


    /**
	 * Called when a module controller has indicated it is ready to be loaded
	 * @param {ModuleController} moduleController
	 * @private
	 */
        /*
	_onModuleAvailable:function(moduleController) {

        moduleController.load();

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

		// load supplied module controller as active module
		this._setActiveModuleController(ModuleController);

	},
    */

    _onModuleLoad:function(moduleController) {

        // listen to unload event so we can load another module if necessary
        Observer.subscribe(moduleController,'unload',this._activeModuleUnloadBind);

        // propagate events from the module controller to the node so people can subscribe to events on the node
        Observer.inform(moduleController,this);

        // publish event
        Observer.publish(this,'load',moduleController);

    },

    _onModuleUnload:function(moduleController) {

        // stop listening to unload
        Observer.unsubscribe(moduleController,'load',this._activeModuleUnloadBind);

        // conceal events from active module controller
        Observer.conceal(moduleController,this);

    }

	/**
	 * Sets the active module controller
	 * @param {ModuleController} ModuleController
	 * @private
	 */
        /*
	_setActiveModuleController:function(ModuleController) {

		// if not already loaded
		if (ModuleController === this._activeModuleController) {
			return;
		}

		// clean up active module controller reference
		this._cleanActiveModuleController();

		// set new active module controller
		this._activeModuleController = ModuleController;

		// listen to unload event so we can load another module if necessary
		Observer.subscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);

		// propagate events from the module controller to the node so people can subscribe to events on the node
		Observer.inform(this._activeModuleController,this);

		// finally load the module controller
		this._activeModuleController.load();

	},
	*/

	/**
	 * Removes the active module controller
	 * @private
	 */
        /*
	_cleanActiveModuleController:function() {

		// if no module controller defined do nothing
		if (!this._activeModuleController) {
			return;
		}

		// stop listening to unload
		Observer.unsubscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);

		// conceal events from active module controller
		Observer.conceal(this._activeModuleController,this);

		// unload controller
		this._activeModuleController.unload();

		// remove reference
		this._activeModuleController = null;
	},
	*/

	/**
	 * Called when active module unloaded
	 * @private
     */
        /*
	_onActiveModuleUnload:function() {

		// clean up active module controller reference
		this._cleanActiveModuleController();

		// active module was unloaded, find another active module
		var ModuleController = this._getSuitableActiveModuleController();
		if(!ModuleController) {
			return;
		}

		// set found module controller as new active module controller
		this._setActiveModuleController(ModuleController);
	},
	*/


	/**
	 * Returns a suitable module controller
	 * @returns {null|ModuleController}
	 * @private
     */
        /*
	_getSuitableActiveModuleController:function() {

		// test if other module is ready, if so load first module to be fitting
		var i=0,l=this._moduleControllers.length,mc;
		for (;i<l;i++) {

			mc = this._moduleControllers[i];

			// if not ready, skip to next controller
			if (!mc.isModuleAvailable()) {
				continue;
			}

			return mc;
		}

		return null;
	}
	*/


};