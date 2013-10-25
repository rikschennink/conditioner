/**
 *
 * @constructor
 */
var SyncedControllerGroup = function() {

    this._hasLoaded = false;

    this._count = arguments.length;
    this._controllers = [];
    this._controllerLoadedBind = this._onLoad.bind(this);
    this._controllerUnloadedBind = this._onUnload.bind(this);

    var i=0,controller;
    for (;i<this._count;i++) {
        controller = arguments[i];

        // skip if method has loaded module not defined
        if (!controller.hasLoadedModule) {continue;}

        // listen to load and unload events so we can pass them on if appropriate
        Observer.subscribe(controller,'load',this._controllerLoadedBind);
        Observer.subscribe(controller,'unload',this._controllerUnloadedBind);

        // we need to collect all controllers so we can measure if they've all loaded
        this._controllers.push(controller);
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

    _test:function() {

        // loop over modules testing their active state
        var i=0;
        for (;i<this._count;i++) {
            if (!this._controllers[i].hasLoadedModule()) {
                return;
            }
        }

        // if all active fire load event
        this._load();
    },

    _load:function() {
        if (!this._hasLoaded) {
            this._hasLoaded = true;
            Observer.publishAsync(this,'load',this._controllers);
        }
    },

    _unload:function() {
        if (this._hasLoaded) {
            this._hasLoaded = false;
            Observer.publish(this,'unload',this._controllers);
        }
    }

};