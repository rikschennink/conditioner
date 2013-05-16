/**
 * @namespace Utils
 */
var Utils = (function(){

    // define method used for matchesSelector
    var _method = null;
    var el = document.body;
    if (el.matches) {
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


    var exports = {

        /**
         * Based on https://github.com/nrf110/deepmerge/blob/master/index.js
         * @memberof Utils
         * @param target {object}
         * @param src {object}
         * @returns {object}
         * @static
         */
        mergeObjects:function(target, src) {

            var array = Array.isArray(src);
            var dst = array && [] || {};

            src = src || {};

            if (array) {

                target = target || [];
                dst = dst.concat(target);

                src.forEach(function(e, i) {

                    if (typeof e === 'object') {
                        dst[i] = exports.mergeObjects(target[i], e);
                    }
                    else {
                        if (target.indexOf(e) === -1) {
                            dst.push(e);
                        }
                    }
                });
            }
            else {

                if (target && typeof target === 'object') {

                    Object.keys(target).forEach(function (key) {
                        dst[key] = target[key];
                    });

                }

                Object.keys(src).forEach(function (key) {

                    if (typeof src[key] !== 'object' || !src[key]) {
                        dst[key] = src[key];
                    }
                    else {
                        if (!target[key]) {
                            dst[key] = src[key];
                        }
                        else {
                            dst[key] = exports.mergeObjects(target[key], src[key]);
                        }
                    }

                });
            }

            return dst;
        },


        /**
         * matches an element to a selector
         * @memberof Utils
         * @param {element} element
         * @param {string} selector
         * @return {Boolean}
         * @static
         */
        matchesSelector:function(element,selector) {
            if (!element || !_method) {
                return false;
            }
            return element[_method](selector);
        }

    };

    return exports;

}());