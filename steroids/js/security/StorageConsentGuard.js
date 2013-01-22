

Namespace.register('security').StorageConsentGuard = (function(){

    'use strict';

    // reference to singleton
    var _instance;

    // StorageConsentGuard
    var StorageConsentGuard = function() {

        // current level
        this._level = null;

        // default options
        this._options = {
            'initial':'all',
            'levels':['all','none']
        };

        this._setDefaultLevel();
    };

    var p = StorageConsentGuard.prototype;

    p.setOptions = function(options) {

        // sets initial options
        this._options = Options.merge(this._options,options);

        this._setDefaultLevel();
    };

    p._setDefaultLevel = function() {
        this.setActiveLevel(this._options.initial);
    };

    p.getLevels = function() {
        return this._options.levels;
    };

    p.getActiveLevel = function() {
        return this._level;
    };

    p.setActiveLevel = function(level) {

        if (level == this._level) {
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


