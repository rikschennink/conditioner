/**
 *
 * @constructor
 */
var SyncedControllerGroup = function() {

    // if no node controllers passed, no go
    if (!arguments || !arguments.length) {
        throw new Error('SyncedControllerGroup(controllers): Expects an array of node controllers as parameters.');
    }

    // by default modules are expected to not be in sync
    this._inSync = false;

    this._controllers = Array.prototype.slice.call(arguments,0);
    this._controllerLoadedBind = this._onLoad.bind(this);
    this._controllerUnloadedBind = this._onUnload.bind(this);

    var i=0,controller,l=this._controllers.length;
    for (;i<l;i++) {
        controller = this._controllers[i];

        // listen to load and unload events so we can pass them on if appropriate
        Observer.subscribe(controller,'load',this._controllerLoadedBind);
        Observer.subscribe(controller,'unload',this._controllerUnloadedBind);
    }

    this._test();
};

SyncedControllerGroup.prototype = {

    _onLoad:function() {
        this._test();
    },

    _onUnload:function() {
        this._unload();
    },

    _isActive:function(controller) {
        return ((controller.isModuleActive && controller.isModuleActive()) ||
                (controller.areModulesActive && !controller.areModulesActive()));
    },

    _test:function() {

        // loop over modules testing their active state, if one is inactive we stop immediately
        var i=0,l=this._controllers.length,controller;
        for (;i<l;i++) {
            controller = this._controllers[i];
            if (!this._isActive(controller)) {
                return;
            }
        }

        // if all modules loaded fire load event
        this._load();
    },

    _load:function() {
        if (this._inSync) {
            return;
        }

        this._inSync = true;
        Observer.publishAsync(this,'load',this._controllers);
    },

    _unload:function() {
        if (!this._inSync) {
            return;
        }

        this._inSync = false;
        Observer.publish(this,'unload',this._controllers);
    }

};