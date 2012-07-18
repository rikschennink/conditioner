
/**
 * OptionsController
 *
 * @class OptionsController
 */
(function() {

    // reference to first instance
    var _instance;

     /**
     * Constructs OptionsController singleton objects.
     *
     * @class OptionsController
     * @constructor
     */
    var OptionsController = function(options) {

        // do singleton check
        if (!_instance) {_instance = this;}
        else {return _instance;}

        this._options = {};
        this._optionsReferenceCache = [];

        if (options) {
            this._options = options;
        }
    };

    /**
     * Returns an options object for a given class path
     *
     * @class OptionsController
     * @method getOptionsForClassPath
     */
    OptionsController.prototype.getOptionsForClassPath = function(classPath) {

        var options,index;

        // check if in cache
        options = this._optionsReferenceCache[classPath];
        if (options) {
            return options;
        }

        // get index
        index = classPath.replace(/\./g,'_');

        // get options subset
        options = this._options[index];
        if (options) {
            // if options found cache for later reference
            this._optionsReferenceCache[classPath] = options;
        }

        return options;
    };

    // Register class
    Namespace.register('bc.core').OptionsController = OptionsController;

}());