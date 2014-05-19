/**
 * Tests if an active network connection is available and monitors this connection
 * @module monitors/connection
 */
(function (win, undefined) {

    'use strict';

    var exports = {
        trigger: {
            'online': win,
            'offline': win
        },
        test: {
            'any': function (data) {
                return data.expected;
            }
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return exports;
        });
    }

}(this));