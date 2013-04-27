/**
 * Tests if an active network connection is available and monitors this connection
 * @module tests/connection
 */
define(['Conditioner'],function(Conditioner){

    'use strict';

    var Test = Conditioner.TestBase.inherit(),
    p = Test.prototype;

    p.handleEvent = function(e) {
        this.assert();
    };

    p.arrange = function() {
        if (navigator.connection) {
            navigator.connection.addEventListener('change', this, false);
        }
    };

    p._onAssert = function(expected) {
        return expected === 'any' && navigator.onLine;
    };

    return Test;

});
