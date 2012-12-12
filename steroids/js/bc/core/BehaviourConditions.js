
Namespace.register('bc.core').BehaviourConditions = (function() {

    "use strict";

    /**
     * Static method construct behaviour condition objects
     *
     * @class BehaviourConditions
     * @method construct
     */
    var BehaviourConditions = {
        fromElement:function(element) {

                // check if has specifications
                var conditionsAttribute = element.getAttribute('data-conditions');
                if (!conditionsAttribute) {
                    return null;
                }

                var conditions = null;
                try {
                    conditions = JSON.parse(conditionsAttribute);
                }
                catch(e) {
                    console.warn("BehaviourConditions: data-conditions attribute should have format data-conditions='{\"foo\":\"bar\"}'");
                    return null;
                }

                return new _BehaviourConditions(element,conditions);
            }
    };



    /**
     * Constructs BehaviourConditions objects.
     * Should only be called from create method.
     *
     *  data-conditions JSON specification
     *  {
     *      "<group>":{
     *          "<type>":<value>
     *      }
     *  }
     *
     * @class _BehaviourConditions
     * @constructor
     * @param {Object} element DOM Element
     */
    var _BehaviourConditions = function(element,conditions) {

        // if the conditions are suitable, by default they are
        this._suitable = true;
        this._element = element;
        this._conditions = [];

        // set options object
        this._options = bc.core.OptionsController.getInstance().getOptionsForClassPath('bc.core.BehaviourConditions');

        // set conditions array
        var key,condition;
        for (key in conditions) {
            condition = new Condition(element,this._options,key,conditions[key]);
            bc.helper.Observer.subscribe(condition,'change',this._onConditionsChanged.bind(this));
            this._conditions.push(condition);
        }

        // test conditions
        this.test();
    };



    // prototype shortcut
    var p = _BehaviourConditions.prototype;

    p._onConditionsChanged = function() {
        this.test();
    };

    p.test = function() {

        // start with suitable conditions
        var suitable = true;

        // check all conditions on suitability
        var condition,i,l = this._conditions.length;
        for (i=0;i<l;i++) {
            condition = this._conditions[i];
            if (!condition.isSuitable()) {
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


    /**
     * Returns true if the current conditions are met
     *
     * @class BehaviourConditions
     * @method areMet
     */
    p.areSuitable = function() {
        return this._suitable;
    };







    /**
    * Condition
    *
    * @class BehaviourConditions
    */
    var Condition = function(element,options,condition,expectations) {

        this._element = element;
        this._condition = condition;
        this._options = options;
        this._suitable = true;

        if (typeof expectations === 'object' && !(expectations instanceof Array)) {
            this._expectations = expectations;
        }
        else {
            this._expectations = {'value':expectations};
        }

        // setup triggers
        this._setup();
    };

    Condition.prototype = {

        _setup:function() {

            // get trigger setup reference for this condition
            var setup = this._options[this._condition].setup;

            // if a trigger setup was found, setup triggers
            if (setup) {
                setup(

                    // test callback
                    this._isSuitable.bind(this),

                    // the element to setup the trigger on
                    this._element,

                    // expectations for the test
                    this._expectations

                );
            }
            else {
                this._isSuitable();
            }

        },

        _isSuitable:function() {

            var suitable = true,
                key,value,test,
                params = Array.prototype.slice.call(arguments),
                valueIndex = params.length,
                spec = this._options[this._condition];

            for (key in this._expectations) {

                value = this._expectations[key];
                test = typeof spec.test === 'function' ? spec.test : spec.test[key];

                // set expected value
                params[valueIndex] = value;

                // call test method for this condition
                if (!test.apply(this,params)) {
                    suitable = false;
                    break;
                }
            }

            if (this._suitable != suitable) {
                this._suitable = suitable;
                bc.helper.Observer.fire(this,'change');
            }

        },

        isSuitable:function() {
            return this._suitable;
        }

    };


    // Register class
    return BehaviourConditions;

}());