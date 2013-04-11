
/**
 * @class BehaviorController
 */
var BehaviorController = (function(require,ModuleRegister,ConditionManager,matchesSelector,mergeObjects){

    /**
     * @constructor
     * @param {string} module - reference to module
     * @param {object} options - options for this behavior controller
     */
    var BehaviorController = function(path,options) {

        // if no element, throw error
        if (!path) {
            throw new Error('BehaviorController(path,options): "path" is a required parameter.');
        }

        // options for class behavior controller should load
        this._path = path;

        // options for behavior controller
        this._options = options || {};

    };


    // prototype shortcut
    var p = BehaviorController.prototype;


    /**
     * Initializes the behavior controller
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

        // if already suitable, load behavior
        if (this._conditionManager.getSuitability()) {
            this._loadBehavior();
        }

    };


    /**
     * Called when the conditions change.
     * @method _onConditionsChange
     */
    p._onConditionsChange = function() {

        var suitable = this._conditionManager.getSuitability();

        if (this._behavior && !suitable) {
            this.unloadBehavior();
        }

        if (!this._behavior && suitable) {
            this._loadBehavior();
        }

    };


    /**
     * Load the behavior set in the data-behavior attribute
     * @method _loadBehavior
     */
    p._loadBehavior = function() {

        var self = this;

        console.log(this._path);
        
        require([this._path],function(klass){

            // get module specification
            var specification = ModuleRegister.getModuleByPath(self._path);

            // setup options
            var moduleOptions = specification.config || {},
                elementOptions,
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
            options = mergeObjects(moduleOptions,elementOptions);

            // create instance of behavior klass
            self._behavior = new klass(self._options.target,options);

            // propagate events from behavior to behaviorController
            Observer.setupPropagationTarget(self._behavior,self);

        });

    };


    /**
     * Public method for unloading the behavior
     * @method unloadBehavior
     * @return {boolean}
     */
    p.unloadBehavior = function() {

        if (!this._behavior) {
            return false;
        }

        // unload behavior if possible
        if (this._behavior._unload) {
            this._behavior._unload();
        }

        // reset property
        this._behavior = null;

        return true;
    };


    /**
     * Public method to check if the behavior matches the given query
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
     * Public method for safely executing methods on the loaded behavior
     * @method execute
     * @param {string} method - method key
     * @param {Array} [params] - array containing the method parameters
     * @return
     */
    p.execute = function(method,params) {

        // if behavior not loaded
        if (!this._behavior) {
            return null;
        }

        // get function reference
        var F = this._behavior[method];
        if (!F) {
            throw new Error('Conditioner(method,params): "method" not found on behavior.');
        }

        // once loaded call method and pass parameters
        return F.apply(this._behavior,params);

    };

    return BehaviorController;

}(require,ModuleRegister,ConditionManager,matchesSelector,mergeObjects));
