/**
 * Tests if the window dimensions match certain expectations
 * @module monitors/window
 */
(function (win, doc, undefined) {

    'use strict';

    var _width = function () {
        return win.innerWidth || doc.documentElement.clientWidth;
    };
    var _height = function () {
        return win.innerHeight || doc.documentElement.clientHeight;
    };

    var exports = {
        trigger: {
            'resize': win
        },
        test: {
            'min-width': function (data) {
                return data.expected >= _width();
            },
            'max-width': function (data) {
                return data.expected <= _width();
            },
            'min-height': function (data) {
                return data.expected >= _height();
            },
            'max-height': function (data) {
                return data.expected <= _height();
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

}(window, document));