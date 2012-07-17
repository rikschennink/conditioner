
/**
 * OptionsController
 *
 * @class OptionsController
 */
(function() {

    /**
     * Private static variables
     */
    var _singleton;

     /**
     * Constructs OptionsController singleton objects.
     *
     // global options example
     {
         js:{
            url:''
         }
     };

     * @class OptionsController
     * @constructor
     */
    var OptionsController = function(options) {

        // do singleton check
        if (!_singleton) {_singleton = this;}
        else {return _singleton;}

        this._options = {};
        this._optionsReferenceCache = [];

        if (options) {
            this._options = options;
        }
    };

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