/**
 * Creates a controller group to sync [ModuleControllers](#modulecontroller).
 *
 * @name SyncedControllerGroup
 * @param {Array} controllers
 * @constructor
 */
var SyncedControllerGroup = function SyncedControllerGroup(controllers) {

	// @ifdef DEV
	// if no node controllers passed, no go
	if (!controllers || !controllers.splice) {
		throw new Error('SyncedControllerGroup(controllers): Expects an array of node controllers as parameters.');
	}
	// @endif

	// by default modules are expected to not be in sync
	this._inSync = false;

	// turn arguments into an array
	this._controllers = controllers;
	this._controllerLoadedBind = this._onLoad.bind(this);
	this._controllerUnloadedBind = this._onUnload.bind(this);

	var i = 0;
	var l = this._controllers.length;
	var controller;

	for (;i < l;i++) {
		controller = this._controllers[i];

		// @ifdef DEV
		// if controller is undefined
		if (!controller) {

			// revert
			this.destroy();

			// throw error
			throw new Error('SyncedControllerGroup(controllers): Stumbled upon an undefined controller');
		}
		// @endif

		// listen to load and unload events so we can pass them on if appropriate
		Observer.subscribe(controller,'load',this._controllerLoadedBind);
		Observer.subscribe(controller,'unload',this._controllerUnloadedBind);
	}

	// test now to see if modules might already be in sync
	this._test();
};

SyncedControllerGroup.prototype = {

	/***
	 * Destroy sync group, stops listening and cleans up
	 *
	 * @method destroy
	 * @memberof SyncedControllerGroup
	 * @public
	 */
	destroy:function() {

		// unsubscribe
		var i = 0;
		var l = this._controllers.length;
		var controller;

		for (;i < l;i++) {
			controller = this._controllers[i];

			// is also called when an undefined controller was found
			if (!controller) {
				continue;
			}

			// listen to load and unload events so we can pass them on if appropriate
			Observer.unsubscribe(controller,'load',this._controllerLoadedBind);
			Observer.unsubscribe(controller,'unload',this._controllerUnloadedBind);
		}

		// reset binds
		this._controllerLoadedBind = null;
		this._controllerUnloadedBind = null;

		// reset array
		this._controllers = null;

	},

	/***
	 * Returns true if all modules have loaded
	 *
	 * @method areAllModulesActive
	 * @memberof SyncedControllerGroup
	 * @returns {Boolean}
	 */
	areAllModulesActive:function() {
		var i = 0;
		var l = this._controllers.length;
		var controller;

		for (;i < l;i++) {
			controller = this._controllers[i];
			if (!this._isActiveController(controller)) {
				return false;
			}
		}

		return true;
	},

	/**
	 * Called when a module loads
	 * @private
	 */
	_onLoad:function() {
		this._test();
	},

	/**
	 * Called when a module unloads
	 * @private
	 */
	_onUnload:function() {
		this._unload();
	},

	/**
	 * Tests if the node or module controller has loaded their modules
	 * @param controller
	 * @returns {Boolean}
	 * @private
	 */
	_isActiveController:function(controller) {
		return ((controller.isModuleActive && controller.isModuleActive()) ||
		(controller.areAllModulesActive && controller.areAllModulesActive()));
	},

	/**
	 * Tests if all controllers have loaded, if so calls the _load method
	 * @private
	 */
	_test:function() {

		// loop over modules testing their active state, if one is inactive we stop immediately
		if (!this.areAllModulesActive()) {return;}

		// if all modules loaded fire load event
		this._load();

	},

	/***
	 * Fires a load event when all controllers have indicated they have loaded and we have not loaded yet
	 *
	 * @memberof SyncedControllerGroup
	 * @fires load
	 * @private
	 */
	_load:function() {
		if (this._inSync) {return;}
		this._inSync = true;
		Observer.publishAsync(this,'load',this._controllers);
	},

	/***
	 * Fires an unload event once we are in loaded state and one of the controllers unloads
	 *
	 * @memberof SyncedControllerGroup
	 * @fires unload
	 * @private
	 */
	_unload:function() {
		if (!this._inSync) {return;}
		this._inSync = false;
		Observer.publish(this,'unload',this._controllers);
	}

};