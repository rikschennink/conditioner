/**
 * @class
 * @constructor
 * @abstract
 */
var TestBase = function() {};

TestBase.prototype = {

    /**
     * Arrange your test in this method
     * @param {string} expected
     * @param {element} element
     * @abstract
     */
    arrange:function(expected,element) { /* jshint -W098 */
        // called each time for each instance
        // override if each instance needs it's own arrangement
    },

    /**
     * Called to assert the test
     * @abstract
     */
    assert:function(expected,element) { /* jshint -W098 */
        // called on test
    }
};