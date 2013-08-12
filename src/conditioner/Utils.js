/**
 * @namespace Utils
 */
var Utils = (function(){

	// define method used for matchesSelector
	var _matchesSelector = null,_method = null,el = document ? document.body : null;
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

	if (_method) {
		// use native matchesSelector method
		_matchesSelector = function(element,selector) {
			element[_method](selector);
		};
	}
	else {
		// check if an element matches a CSS selector
		// https://gist.github.com/louisremi/2851541
		_matchesSelector = function(element,selector) {

			// We'll use querySelectorAll to find all element matching the selector,
			// then check if the given element is included in that list.
			// Executing the query on the parentNode reduces the resulting nodeList,
			// document doesn't have a parentNode, though.
			var nodeList = (element.parentNode || document).querySelectorAll(selector) || [],
				i = nodeList.length;

			// loop on the nodeList
			while (i--) {
				if (nodeList[i] == element) {return true;}
			}
			return false;
		};
	}

	// define contains method based on browser capabilities
	var _contains = null;
	if (document.body.compareDocumentPosition) {
		_contains = function(parent,child) {
			return parent.compareDocumentPosition(a) & 16;
		}
	}
	else if (document.body.contains) {
		_contains = function(parent,child) {
			return parent != child && parent.contains(child);
		}
	}
	else {
		_contains = function(parent,child) {
			var node = child.parentNode;
			while (node) {
				if (node === parent) {
					return true;
				}
				node = node.parentNode;
			}
			return false;
		}
	}

	var exports = {

		/**
		 * Based on https://github.com/nrf110/deepmerge/blob/master/index.js
		 * @memberof Utils
		 * @param target {Object}
		 * @param src {Object}
		 * @returns {Object}
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
		 * @param {Element} element
		 * @param {String} selector
		 * @return {Boolean}
		 * @static
		 */
		matchesSelector:function(element,selector) {
			if (!element) {
				return false;
			}
			return _matchesSelector(element,selector);
		},

		/**
		 * Tests if a child is a descendant of a given parent
		 * @memberof Utils
		 * @param child {Element}
		 * @param parent {Element}
		 * @returns {Boolean}
		 * @static
		 */
		isDescendant:function(child,parent) {
			return _contains(parent,child);
		}

	};

	return exports;

}());