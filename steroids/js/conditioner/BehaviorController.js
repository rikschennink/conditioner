/**
 * @module conditioner/BehaviorController
 */
Namespace.register('conditioner').BehaviorController = (function() {

    'use strict';

    /**
     * Constructs BehaviorController objects.
     *
     * @class BehaviorController
     * @constructor
     * @param {String} classPath - path to this behavior
     * @param {Object} classOptions - options for this behavior
     * @param {Object} options - options for this behavior controller
     */
    var BehaviorController = function(classPath,classOptions,options) {

        // options for class behavior controller should load
        this._classPath = classPath;
        this._classOptions = classOptions;

        // options for behavior controller
        this._options = options || {};

        // check if conditions specified
        this._conditionManager = new conditioner.ConditionManager(
            this._options.conditions,
            this._options.target
        );

        // listen to changes in conditions
        Observer.subscribe(this._conditionManager,'change',this._onConditionsChange.bind(this));

        // if already suitale, load behavior
        if (this._conditionManager.getSuitability()) {
            this._loadBehavior();
        }

    };


    // prototype shortcut
    var p = BehaviorController.prototype;


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

        Namespace.load(
            this._classPath,
            function(Class){
                self._initBehavior(Class);
            },
            function(error) {
                console.warn(error);
            }
        );

    };

    /**
     * Initialize the class passed and decide what parameters to pass
     * @method _initBehavior
     */
    p._initBehavior = function(Class) {

        if (this._options.target) {
            this._behavior = new Class(this._options.target,this._classOptions);
        }
        else {
            this._behavior = new Class(this._classOptions);
        }

    };


    /**
     * Public method for unload the behavior
     * @method unloadBehavior
     */
    p.unloadBehavior = function() {

        if (!this._behavior) {
            return false;
        }

        this._behavior._unload();
        this._behavior = null;

        return true;
    };


    // Register class
    return BehaviorController;

}());