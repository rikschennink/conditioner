define(['utils/Observer','utils/mergeObjects','module'],function(Observer,mergeObjects,module){

    'use strict';

    // StorageConsentGuard
    var StorageConsentGuard = function() {

        // current level
        this._level = null;

        // set options
        this.setOptions(module.config());

        // set default level
        this._setDefaultLevel();
    };

    StorageConsentGuard.prototype = {

        setOptions:function(options) {

            if (!options) {options = {};}

            // sets initial options
            this._options = mergeObjects({
                'initial':'all',
                'levels':['all','none']
            },options);

            this._setDefaultLevel();
        },

        _setDefaultLevel:function() {
            this.setActiveLevel(this._options.initial);
        },

        getLevels:function() {
            return this._options.levels;
        },

        getActiveLevel:function() {
            return this._level;
        },

        setActiveLevel:function(level) {

            // if is already the active level
            if (level === this._level) {return;}

            // set new level
            this._level = level;

            Observer.publish(this,'change',this._level);
        }

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