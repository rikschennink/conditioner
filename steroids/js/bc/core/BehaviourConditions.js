
/**
 * BehaviourConditions
 *
 * @class BehaviourConditions
 */
(function() {

    /**
     * Constructs BehaviourConditions objects.
     * Should only be called from create method.
     *
     *  data-conditions JSON specification
     *  {
     *      "window":{
     *          "minWidth":<Number>,
     *          "maxWidth":<Number>
     *      }
     *  }
     *
     * @class BehaviourConditions
     * @constructor
     * @param {Object} element DOM Element
     */
    var BehaviourConditions = function(element,conditions) {

        // if the conditions are suitable, by default they are
        this._suitable = true;

        // set properties object
        this._conditions = conditions;

        // set options object
        this._options = new bc.core.OptionsController().getOptionsForClassPath('bc.core.BehaviourConditions');

        // check if we need to listen to certain environment changes
        this._listen();

        // test the conditions
        this._test();

    };

    /**
     * Static method construct behaviour condition objects
     *
     * @class BehaviourConditions
     * @method construct
     */
    BehaviourConditions.construct = function(element) {

        // check if has specifications
        var conditionsSpecifications = element.getAttribute('data-conditions');
        if (!conditionsSpecifications) {
            return null;
        }
    
        var conditions = null;
        try {
            conditions = JSON.parse(conditionsSpecifications);
        }
        catch(e) {
            console.warn("BehaviourConditions: data-conditions attribute should have format data-conditions='{\"foo\":\"bar\"}'");
            return null;
        }
    
        return new bc.core.BehaviourConditions(element,conditions)
    
    };


    // prototype shortcut
    var p = BehaviourConditions.prototype;


    /**
     * Adds listeners to the environment to act when it changes
     *
     * @class BehaviourConditions
     * @method _listen
     */
    p._listen = function() {

        var check,events,event;
        for(check in this._options) {
            if (!this._options.hasOwnProperty(check)) {
                continue;
            }
            events = this._options[check]['event'];

            for(eventSpecification in events) {
                if (!events.hasOwnProperty(eventSpecification)) {
                    continue;
                }
                this._listenTo(eventSpecification,events[eventSpecification]());
            }
        }


    };

    /**
     * Decides what kind of listeners are required for certain events
     *
     * @class BehaviourConditions
     * @method _listen
     */
    p._listenTo = function(event,obj) {
        var testBind = this._test.bind(this);
        if (obj.addEventListener) {
            obj.addEventListener(event,testBind);
        }
        else {
            bc.helper.Observer.subscribe(obj,event,testBind);
        }
    };



    /**
     * Checks if the current conditions match the requested properties
     *
     * @class BehaviourConditions
     * @method _test
     */
    p._test = function() {

        // start with suitable conditions
        var suitable = true;

        // test condition properties
        var condition;
        for(condition in this._conditions) {
            if (!this._conditions.hasOwnProperty(condition)) {
                continue;
            }

            if (!this._testCondition(condition,this._conditions[condition])) {
                suitable = false;
                break;
            }
        }

        // fire changed event if environment suitability changed
        if (suitable != this._suitable) {
            this._suitable = suitable;
            bc.helper.Observer.fire(this,'change');
        }
    };

    p._testCondition = function(type,condition) {

        var checks = this._options[type].condition;
        var check,value;
        for(check in condition) {
            if (!condition.hasOwnProperty(check)) {
                continue;
            }

            // get value for condition check
            value = condition[check];

            // check if meets condition
            if (checks[check](value)) {
                return false;
            }
        }

        return true;
    };

    /**
     * Returns true if the current conditions are met
     *
     * @class BehaviourConditions
     * @method areMet
     */
    p.areMet = function() {
        return this._suitable;
    };

    // Register class
    Namespace.register('bc.core').BehaviourConditions = BehaviourConditions;

}());