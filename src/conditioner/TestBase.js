/**
 * @class
 * @constructor
 * @abstract
 */
var TestBase = function() {

    this._memory = {};

};

TestBase.prototype = {

    /**
     *
     * @param {object} key
     * @param {object} value
     * @returns {object}
     * @protected
     */
    remember:function(key,value) {

        // return value
        if (typeof value === 'undefined') {
            return this._memory[key];
        }

        // set value
        this._memory[key] = value;
        return value;
    },

    /**
     * Delegates events to act method
     * @param {Event} e
     * @private
     */
    handleEvent:function(e) {
        this.act(e);
    },

    /**
     * Arrange your test in this method
     * @abstract
     */
    arrange:function() {

        // called once

    },

    /**
     * Handle changes in this method
     * @abstract
     */
    act:function(e) {

        // by default triggers 'change' event
        Observer.publish(this,'change');

    },

    /**
     * Called to assert the test
     * @abstract
     */
    assert:function(expected,element) {

        // called on test

    }

};