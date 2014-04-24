/**
 * Tests if an active network connection is available and monitors this connection
 * @module tests/connection
 */
(function (nav, win, undefined) {

    'use strict';

    var test = {

        /**
         * Does this browser support the onLine property
         * @returns {Boolean}
         */
        support: function () {
            return 'onLine' in nav;
        },

        /**
         * setup events to listen for connection changes
         * @param {Function} measure
         */
        setup: function (measure) {
            win.addEventListener('online', measure, false);
            win.addEventListener('offline', measure, false);
        },

        /**
         * Assert if the connection is the same as the expected value of the connection
         * @param {String} expected
         * @returns {Boolean}
         */
        assert: function (expected) {
            return expected === 'any' && nav.onLine;
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = test;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return test;
        });
    }

}(navigator, window));