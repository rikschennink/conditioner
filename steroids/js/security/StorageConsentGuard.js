

Namespace.register('security').StorageConsentGuard = (function(){

    "use strict";

    // reference to first instance
    var _instance;


    /**
     * Returns StorageConsentGuard instance
     *
     * @class StorageConsentGuard
     */
    var StorageConsentGuard = {

        getInstance:function() {
            if (!_instance) { _instance = new _StorageConsentGuard(); }
            return _instance;
        }

    };



    /**
    * Constructs StorageConsentGuard objects
    *
    * @class _StorageConsentGuard
    * @constructor
    */
    var _StorageConsentGuard = function() {

        // get options for storage guard
        this._options = bc.core.OptionsController.getInstance().getOptionsForClassPath('security.StorageConsentGuard');

        // set initial storage level
        this._level = this._options.initial;


    };

    var p = _StorageConsentGuard.prototype;

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

        bc.helper.Observer.fire(this,'change',this._level);
    };

    return StorageConsentGuard;

}());


