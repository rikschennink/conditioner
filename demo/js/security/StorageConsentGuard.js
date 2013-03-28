
define(['conditioner/Observer','conditioner/MergeObjects'],function(Observer,mergeObjects){

    'use strict';

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
        this._options = mergeObjects(this._options,options);

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

        Observer.publish(this,'change',this._level);
    };


    // reference to singleton
    var _instance;

    return {
        getInstance:function() {
            if (!_instance) { _instance = new StorageConsentGuard(); }
            return _instance;
        }
    };

});
