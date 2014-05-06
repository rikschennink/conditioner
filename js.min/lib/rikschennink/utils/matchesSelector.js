(function (win, doc, undefined) {

    

    // define method used for matchesSelector
    var util = null,
        _method = null,
        el = doc ? doc.body : null;
    if (!el || el.matches) {
        _method = 'matches';
    }
    else if (el.webkitMatchesSelector) {
        _method = 'webkitMatchesSelector';
    }
    else if (el.mozMatchesSelector) {
        _method = 'mozMatchesSelector';
    }
    else if (el.msMatchesSelector) {
        _method = 'msMatchesSelector';
    }
    else if (el.oMatchesSelector) {
        _method = 'oMatchesSelector';
    }

    // if method found use native matchesSelector
    if (_method) {
        util = function (element, selector) {
            return element[_method](selector);
        };
    }
    else {

        // check if an element matches a CSS selector
        // https://gist.github.com/louisremi/2851541
        util = function (element, selector) {

            // We'll use querySelectorAll to find all element matching the selector,
            // then check if the given element is included in that list.
            // Executing the query on the parentNode reduces the resulting nodeList,
            // document doesn't have a parentNode, though.
            var nodeList = (element.parentNode || doc).querySelectorAll(selector) || [],
                i = nodeList.length;

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
        win.matchesSelector = util;
    }

}(window, document));