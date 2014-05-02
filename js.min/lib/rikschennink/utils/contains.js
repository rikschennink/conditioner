(function (win, doc, undefined) {

    'use strict';

    // define contains method based on browser capabilities
    var el = doc ? doc.body : null,
        util;
    if (el && el.compareDocumentPosition) {
        util = function (parent, child) { /* jshint -W016 */
            return !!(parent.compareDocumentPosition(child) & 16);
        };
    }
    else if (el && el.contains) {
        util = function (parent, child) {
            return parent != child && parent.contains(child);
        };
    }
    else {
        util = function (parent, child) {
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
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = util;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return util;
        });
    }
    // Browser globals
    else {
        win.contains = util;
    }

}(window, document));