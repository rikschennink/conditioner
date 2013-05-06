/**
 * @class
 * @constructor
 * @abstract
 */
var TestBase = function() {};

TestBase.prototype = {

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