
/**
 * BehaviorController Class.
 *
 * @class BehaviorController
 */
Namespace.register('conditioner').BehaviorController = (function() {

    'use strict';


    /**
     * Constructs BehaviorController objects.
     *
     * @class BehaviorController
     * @constructor
     * @param {Node} Element
     * @param {Object} Configuration options for this Element
     * @param {Object} Configuration options for this BehaviorController
     */
    var BehaviorController = function(element,options) {

        // set element and options reference
        this._element = element;
        this._options = options;

        // check if conditions specified
        this._conditions = new conditioner.ConditionManager(this._element);

        // listen to condition changes
        Observer.subscribe(this._conditions,'change',this._onConditionsChange.bind(this));

        // if conditions are met, load my behavior
        if (this._conditions.areSuitable()) {
            this._loadBehavior();
        }

    };


    // prototype shortcut
    var p = BehaviorController.prototype;


    /**
     * Called when the conditions change.
     *
     * @class BehaviorController
     * @method _onConditionsChange
     */
    p._onConditionsChange = function() {

        var suitable = this._conditions.areSuitable();

        if (this._behavior && !suitable) {
            this.unloadBehavior();
        }

        if (!this._behavior && suitable) {
            this._loadBehavior();
        }
    };


    /**
     * Load the behavior set in the data-behavior attribute
     *
     * @class BehaviorController
     * @method _loadBehavior
     */
    p._loadBehavior = function() {

        // get classpath
        var classPath = this._element.getAttribute('data-behavior');
        
        // load by classpath
        var self = this;
        Namespace.load(
            classPath,
            function(Class){
                self._behavior = new Class(self._element,self._options);
            },
            function(error) {
                console.warn(error);
            }
        );

    };


    /**
     * Public method for unload the behavior
     *
     * @class BehaviorController
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