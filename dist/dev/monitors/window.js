/**
 * Tests if the window dimensions match certain expectations
 * @module monitors/window
 */
(function (win, undefined) {

    'use strict';

    var doc = win.document;
    var width = function () {
        return win.innerWidth || doc.documentElement.clientWidth;
    };
    var height = function () {
        return win.innerHeight || doc.documentElement.clientHeight;
    };
    var toInt = function (value) {
        return parseInt(value, 10);
    };

    var exports = {
        trigger: {
            'resize': win
        },
        test: {
            'min-width': function (data) {
                return toInt(data.expected) <= width();
            },
            'max-width': function (data) {
                return toInt(data.expected) >= width();
            },
            'min-height': function (data) {
                return toInt(data.expected) <= height();
            },
            'max-height': function (data) {
                return toInt(data.expected) >= height();
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