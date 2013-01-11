
Namespace.register('conditioner').ConditionManager = (function() {


    'use strict';


    /**
     * Constructs ConditionManager objects.
     *
     *  data-conditions JSON specification
     *  {
     *      "<group>":{
     *          "<type>":<value>
     *      }
     *  }
     *
     * @class ConditionManager
     * @constructor
     * @param {Node} Element
     * @param {Object} Expected Conditions
     */
    var ConditionManager = function(element,expected) {

        // if the conditions are suitable, by default they are
        this._suitable = true;
        this._element = element;

        // check if required parameter element has been passed
        if (!element) {
            return null;
        }

        // if required conditions have not been supplied
        if (!expected) {

            // find them on element
            expected = this._element.getAttribute('data-conditions');

            // see if able to parse
            try {
                expected = JSON.parse(expected);
            }
            catch(e) {
                console.warn("ConditionManager: required conditions should be in JSON format");
                return null;
            }
        }
        
        // set properties
        this._conditions = [];

        // set conditions array
        var key,condition,conditioner = Conditioner.getInstance();
        for (key in expected) {

            // define condition
            condition = new Condition(
                element,
                conditioner.getTestByKey(key),
                expected[key]
            );

            // listen to condition changes
            Observer.subscribe(condition,'change',this._onConditionsChanged.bind(this));

            // add to list of managed conditions for this element
            this._conditions.push(condition);
        }

        // test conditions
        this.test();
    };


    /**
     * regsiter a new condition test
     *
     * @class ConditionManager
     * @method registerTest
     * @param {String}
     * @param {Object}
     * @param {Function} Optional
     */
    ConditionManager.registerTest = function(key,arrange,assert) {
        ConditionTests.registerTest(key,arrange,assert);
    };


    // prototype shortcut
    ConditionManager.prototype = {


        /**
         * Called when a condition has changed
         *
         * @class ConditionManager
         * @method _onConditionsChanged
         */
        _onConditionsChanged:function() {
            this.test();
        },


        /**
         * Tests if conditions are suitable
         *
         * @class ConditionManager
         * @method test
         */
        test:function() {

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
                Observer.fire(this,'change');
            }
        },


        /**
         * Returns true if the current conditions are met
         *
         * @class ConditionManager
         * @method areMet
         */
        areSuitable:function() {
            return this._suitable;
        }
    };







    /**
    * Condition
    *
    * @class Condition
    *
    * @constructor
    * @param {Node} Element
    * @param {Object} Rule
    * @param {Object} expectations
    */
    var Condition = function(element,test,expectations) {

        this._element = element;
        this._test = test;
        this._suitable = true;
        
        if (typeof expectations === 'object' && !(expectations instanceof Array)) {
            this._expectations = expectations;
        }
        else {
            this._expectations = {'value':expectations};
        }

        // arrange test
        this._arrange();
    };

    Condition.prototype = {

        _arrange:function() {

            // get trigger setup reference for this condition
            var arrange = this._test.arrange;

            // if a trigger setup was found, setup triggers
            if (arrange) {
                arrange(

                    // test callback
                    this._assert.bind(this),

                    // the element to setup the trigger on
                    this._element,

                    // expectations for the test
                    this._expectations

                );
            }
            else {
                this._assert();
            }

        },

        _assert:function() {

            var suitable = true,
                key,value,assert,
                params = Array.prototype.slice.call(arguments),
                valueIndex = params.length,
                test = this._test;

            for (key in this._expectations) {

                value = this._expectations[key];
                assert = typeof test.assert === 'function' ? test.assert : test.assert[key];

                // set expected value
                params[valueIndex] = value;

                // call test method for this condition
                if (!assert.apply(this,params)) {
                    suitable = false;
                    break;
                }
            }

            if (this._suitable != suitable) {
                this._suitable = suitable;
                Observer.fire(this,'change');
            }

        },

        isSuitable:function() {
            return this._suitable;
        }

    };

    return ConditionManager;

    /**
     * Static method construct behaviour condition objects
     *
     * @class ConditionManager
     * @method construct

    return {
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
                console.warn("ConditionManager: data-conditions attribute should have format data-conditions='{\"foo\":\"bar\"}'");
                return null;
            }

            return new ConditionManager(element,conditions);
        }
    };
     */
}());