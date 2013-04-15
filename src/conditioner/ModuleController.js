
/**
 * @class ModuleController
 */
var ModuleController = (function(require,ModuleRegister,ConditionManager,matchesSelector,mergeObjects){

    /**
     * @constructor
     * @param {string} path - reference to module
     * @param {object} options - options for this behavior controller
     */
    var ModuleController = function(path,options) {
        
        // if no element, throw error
        if (!path) {
            throw new Error('ModuleController(path,options): "path" is a required parameter.');
        }

        // options for class behavior controller should load
        this._path = path;

        // options for behavior controller
        this._options = options || {};
        this._options.suitable = typeof this._options.suitable === 'undefined' ? true : this._options.suitable;

        // module reference
        this._module = null;

    };


    // prototype shortcut
    var p = ModuleController.prototype;


    /**
     * Initializes the module controller
     * @method init
     */
    p.init = function() {

        // check if conditions specified
        this._conditionManager = new ConditionManager(
            this._options.conditions,
            this._options.target
        );

        // listen to changes in conditions
        Observer.subscribe(this._conditionManager,'change',this._onConditionsChange.bind(this));

        // if already suitable, load module
        if (this._conditionManager.getSuitability() === this._options.suitable) {
            this._loadModule();
        }

    };


    /**
     * Called when the conditions change.
     * @method _onConditionsChange
     */
    p._onConditionsChange = function() {

        var suitable = this._conditionManager.getSuitability();

        if (this._module && suitable !== this._options.suitable) {
            this.unloadModule();
        }

        if (!this._module && suitable === this._options.suitable) {
            this._loadModule();
        }

    };


    /**
     * Load the module set in the referenced in the path property
     * @method _loadModule
     */
    p._loadModule = function() {

        var self = this;

        require([this._path],function(klass){

            // get module specification
            var specification = ModuleRegister.getModuleByPath(self._path),
                moduleOptions = specification ? specification.config : {},
                elementOptions = {},
                options;

            // parse element options
            if (typeof self._options.options == 'string') {
                try {
                    elementOptions = JSON.parse(self._options.options);
                }
                catch(e) {}
            }
            else {
                elementOptions = self._options.options;
            }

            // merge options if necessary
            options = moduleOptions ? mergeObjects(moduleOptions,elementOptions) : elementOptions;

            // create instance of behavior klass
            self._module = new klass(self._options.target,options);

            // propagate events from behavior to behaviorController
            Observer.setupPropagationTarget(self._module,self);

        });

    };


    /**
     * Public method for unloading the module
     * @method unloadModule
     * @return {boolean}
     */
    p.unloadModule = function() {

        if (!this._module) {
            return false;
        }

        // unload behavior if possible
        if (this._module._unload) {
            this._module._unload();
        }

        // reset property
        this._module = null;

        return true;
    };


    /**
     * Public method to check if the module matches the given query
     * @method matchesQuery
     * @param {object || string} query - string query to match or object to match
     * @return {boolean} if matched
     */
    p.matchesQuery = function(query) {

        if (typeof query == 'string') {

            // check if matches query
            if (matchesSelector(this._options.target,query)) {
                return true;
            }
            
        }

        return (query == this._options.target);
    };



    /**
     * Public method for safely executing methods on the loaded module
     * @method execute
     * @param {string} method - method key
     * @param {Array} [params] - array containing the method parameters
     * @return
     */
    p.execute = function(method,params) {

        // if behavior not loaded
        if (!this._module) {
            return null;
        }

        // get function reference
        var F = this._module[method];
        if (!F) {
            throw new Error('Conditioner(method,params): "method" not found on module.');
        }

        // once loaded call method and pass parameters
        return F.apply(this._module,params);

    };

    return ModuleController;

}(require,ModuleRegister,ConditionManager,matchesSelector,mergeObjects));
