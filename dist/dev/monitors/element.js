/**
 * Tests if an elements dimensions match certain expectations
 * @module monitors/element
 */
(function (win, undefined) {

    'use strict';

    var isVisible = function (element) {
        var viewHeight = win.innerHeight;
        var bounds = element.getBoundingClientRect();
        return (bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight);
    };
    var toInt = function (value) {
        return parseInt(value, 10);
    };

    var exports = {
        trigger: {
            'resize': win,
            'scroll': win
        },
        test: {
            'visible': function (data) {
                data.seen = isVisible(data.element);
                return data.seen && data.expected;
            },
            'min-width': function (data) {
                return toInt(data.expected) <= data.element.offsetWidth;
            },
            'max-width': function (data) {
                return toInt(data.expected) >= data.element.offsetWidth;
            },
            'min-height': function (data) {
                return toInt(data.expected) <= data.element.offsetHeight;
            },
            'max-height': function (data) {
                return toInt(data.expected) >= data.element.offsetHeight;
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