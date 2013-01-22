/**
 * @module conditioner/ConditionManager
 */
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
     * @param {Object} expected - expected conditions to be met
     * @param {Node} element - optional element to measure these conditions on
     */
    var ConditionManager = function(expected,element) {

        // if the conditions are suitable, by default they are
        this._suitable = true;

        // if no conditions, conditions will always be suitable
        if (!expected) {
            return;
        }

        // set element reference
        this._element = element;

        // if expected is in string format try to parse as JSON
        if (typeof expected == 'string') {
            try {
                expected = JSON.parse(expected);
            }
            catch(e) {
                console.warn('ConditionManager(expected,element): expected conditions should be in JSON format.');
                return;
            }
        }

        // set properties
        this._conditions = [];

        // set conditions array
        var key,condition,conditioner = Conditioner.getInstance();
        for (key in expected) {

            if (!expected.hasOwnProperty(key)) {
                continue;
            }

            // define condition
            condition = new Condition(
                conditioner.getTestByKey(key),
                expected[key],
                this._element
            );

            // listen to condition changes
            Observer.subscribe(condition,'change',this._onConditionsChanged.bind(this));

            // add to list of managed conditions for this element
            this._conditions.push(condition);
        }

        // test conditions
        this.test();
    };



    // prototype shortcut
    ConditionManager.prototype = {


        /**
         * Called when a condition has changed
         * @method _onConditionsChanged
         */
        _onConditionsChanged:function() {
            this.test();
        },


        /**
         * Tests if conditions are suitable
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
         * Returns true if the current conditions are suitable
         * @method getSuitability
         */
        getSuitability:function() {
            return this._suitable;
        }
    };







    /**
    * Condition
    *
    * @class Condition
    *
    * @constructor
    * @param {Object} test
    * @param {Object} expectations
    * @param {Node} element
    */
    var Condition = function(test,expectations,element) {

        this._test = test;
        this._suitable = true;
        this._element = element;
        
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

                    // expectations for the test
                    this._expectations,

                    // the element to setup the trigger on (if necessary)
                    this._element

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

                if (!this._expectations.hasOwnProperty(key)) {
                    continue;
                }

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

}());