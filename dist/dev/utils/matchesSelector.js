(function (win, undefined) {

    'use strict';

    // define method used for matchesSelector
    var exports = null;
    var _method = null;
    var el = win.document ? win.document.body : null;

    if (!el || el.matches) {
        _method = 'matches';
    }
    else {
        if (el.webkitMatchesSelector) {
            _method = 'webkit';
        }
        else if (el.mozMatchesSelector) {
            _method = 'moz';
        }
        else if (el.msMatchesSelector) {
            _method = 'ms';
        }
        else if (el.oMatchesSelector) {
            _method = 'o';
        }
        _method += 'MatchesSelector';
    }

    // if method found use native matchesSelector
    if (_method) {
        exports = function (element, selector) {
            return element[_method](selector);
        };
    }
    else {

        // check if an element matches a CSS selector
        // https://gist.github.com/louisremi/2851541
        exports = function (element, selector) {

            // We'll use querySelectorAll to find all element matching the selector,
            // then check if the given element is included in that list.
            // Executing the query on the parentNode reduces the resulting nodeList,
            // document doesn't have a parentNode, though.
            var nodeList = (element.parentNode || win.document).querySelectorAll(selector) || [];
            var i = nodeList.length;

            // loop through nodeList
            while (i--) {
                if (nodeList[i] == element) {
                    return true;
                }
            }
            return false;
        };

    }

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
    // Browser globals
    else {
        win.matchesSelector = exports;
    }

}(this));