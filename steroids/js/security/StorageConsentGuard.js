

Namespace.register('security').StorageConsentGuard = (function(){

    "use strict";

    // reference to singleton
    var _instance;


    // StorageConsentGuard
    var StorageConsentGuard = function() {

        // get options for storage guard
        this._options = conditioner.OptionsController.getInstance().getOptionsForClassPath('security.StorageConsentGuard');

        // stop when no options available
        if (!this._options) {
            this._options = {};
        }

        // set initial storage level
        this._level = this._options.initial;


    };

    var p = StorageConsentGuard.prototype;

    p.getLevels = function() {
        return this._options.levels;
    };

    p.getActiveLevel = function() {
        return this._level;
    };

    p.setActiveLevel = function(level) {

        if (level === this._level) {
            return;
        }

        this._level = level;

        Observer.fire(this,'change',this._level);
    };

    return {

        getInstance:function() {
            if (!_instance) { _instance = new StorageConsentGuard(); }
            return _instance;
        }

    };

}());


