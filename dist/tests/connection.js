
/**
 * Tests if an active network connection is available and monitors this connection
 * @module tests/connection
 */
define(function(){

    'use strict';

    return {

        /**
         * Does this browser support the onLine property
         * @returns {Boolean}
         */
        support:function() {
            return 'onLine' in navigator;
        },

        /**
         * setup events to listen for connection changes
         * @param {Function} measure
         */
        setup:function(measure) {
            window.addEventListener('online',measure,false);
            window.addEventListener('offline',measure,false);
        },

        /**
         * Assert if the connection is the same as the expected value of the connection
         * @param {String} expected
         * @returns {Boolean}
         */
        assert:function(expected) {
            return expected === 'any' && navigator.onLine;
        }
    };

});
