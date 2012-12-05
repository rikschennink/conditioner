
/**
 * OptionsController
 *
 * @class OptionsController
 */
Namespace.register('bc.core').OptionsController = (function() {

    "use strict";

    // reference to first instance
    var _instance;


    /**
     * Returns OptionsController instance
     *
     * @class OptionsController
     * @param {Object} global options for OptionsController
     */
    var OptionsController = {
        getInstance:function() {
            if (!_instance) { _instance = new _OptionsController(); }
            return _instance;
        }
    };


     /**
     * Constructs OptionsController singleton objects.
     *
     * @class _OptionsController
     * @constructor
     */
    var _OptionsController = function() {
        this._options = {};
    };

    _OptionsController.prototype = {

        /**
         * Loads additional options to the OptionsController
         *
         * @class _OptionsController
         * @method load
         * @param {Object} options
         */
        load:function(options) {
            for (var key in options) {
                this._options[key] = options[key];
            }
        },

        /**
         * Returns an options object for a given class path
         *
         * @class _OptionsController
         * @method getOptionsForClassPath
         * @param {String} classPath to class
         */
        getOptionsForClassPath:function(classPath) {
            var options = this._options[classPath];
            if (options) {
                return options;
            }
            else {
                console.warn('OptionsController: Could not find options for "' + classPath + '"');
            }
        }
    };


    // Register class
    return OptionsController;

}());