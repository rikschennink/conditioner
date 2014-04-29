/**
 * Tests if an elements dimensions match certain expectations
 * @module monitors/element
 */
(function (win, doc, undefined) {

    'use strict';

    var _isVisible = function (element) {
        var viewHeight = win.innerHeight,
            bounds = element.getBoundingClientRect();
        return (bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight);
    };

    var exports = {
        data: {
            seen: false
        },
        trigger: {
            'resize': win,
            'scroll': win
        },
        test: {
            'seen': function (data) {
                if (!data.seen) {
                    data.seen = _isVisible(data.element);
                }
                return data.seen && data.expected;
            },
            'min-width': function (data) {
                return data.expected >= data.element.offsetWidth;
            },
            'max-width': function (data) {
                return data.expected <= data.element.offsetWidth;
            },
            'min-height': function (data) {
                return data.expected >= data.element.offsetHeight;
            },
            'max-height': function (data) {
                return data.expected <= data.element.offsetHeight;
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