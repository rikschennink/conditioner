
/**
 * @class ModuleGroup
 */
var ModuleGroup = (function(Observer){


    /**
     * @constructor
     * @param {Array} modules - array containing the module controllers in this group
     */
    var ModuleGroup = function(modules) {

        // if no modules array, throw error
        if (!modules) {
            throw new Error('ModuleGroup(modules): "modules" is a required parameter.');
        }

        // active module reference
        this._activeModule = null;

        // binds
        this._onLoadBind = this._onLoad.bind(this);
        this._onUnloadBind = this._onUnload.bind(this);

        // options for class behavior controller should load
        this._modules = modules;

        // listen to load and unload on modules
        var i=0,l=modules.length,mod;
        for (;i<l;i++) {

            mod = modules[i];
            Observer.subscribe(mod,'load',this._onLoadBind);
            Observer.subscribe(mod,'unload',this._onUnloadBind);

        }
    };


    // prototype shortcut
    var p = ModuleGroup.prototype;


    /**
     * Called when a module was loaded
     * @method _onLoad
     * @param {Module} mod
     */
    p._onLoad = function(mod) {

        this._activeModule = mod;

        console.log(this._activeModule);

    };


    /**
     * Called when a module was unloaded
     * @method _onUnload
     * @param {Module} mod
     */
    p._onUnload = function(mod) {



    };

    return ModuleGroup;


}(Observer));
