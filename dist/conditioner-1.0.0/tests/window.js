/**
 * Tests if the window dimensions match certain expectations
 * @module tests/window
 */
(function (win, doc, undefined) {

    'use strict';

    var _width = 0;

    var test = {

        /**
         * Listen to resize event to measure new window width
         * @param {Function} measure
         */
        setup: function (measure) {
            win.addEventListener('resize', measure, false);
        },

        /**
         * Custom measure function to store window width before calling change
         * @returns {Boolean}
         */
        measure: function () {

            _width = win.innerWidth || doc.documentElement.clientWidth;

            return true;
        },

        /**
         * test if matches expected value
         * @param {String} expected
         * @returns {Boolean}
         */
        assert: function (expected) {

            var parts = expected.split(':'),
                key = parts[0],
                value = parseInt(parts[1], 10);

            if (key === 'min-width') {
                return _width >= value;
            }
            else if (key === 'max-width') {
                return _width <= value;
            }

            return false;

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

}(window, document));