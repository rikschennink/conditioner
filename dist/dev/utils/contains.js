(function (win, undefined) {

    'use strict';

    // define contains method based on browser capabilities
    var el = win.document ? win.document.body : null;
    var exports;

    if (el && el.compareDocumentPosition) {
        exports = function (parent, child) { /* jshint -W016 */
            return !!(parent.compareDocumentPosition(child) & 16);
        };
    } /* istanbul ignore next */
    else if (el && el.contains) {
        exports = function (parent, child) {
            return parent != child && parent.contains(child);
        };
    } /* istanbul ignore else */
    else {
        exports = function (parent, child) {
            var node = child.parentNode;
            while (node) {
                if (node === parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        };
    }

    // CommonJS
    /* istanbul ignore if */
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return exports;
        });
    }
    // Browser globals
    /* istanbul ignore else */
    else { /* istanbul ignore next */
        win.contains = exports;
    }

}(this));