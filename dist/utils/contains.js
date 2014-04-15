define(function() {

    'use strict';

	// define contains method based on browser capabilities
	var el = document ? document.body : null;
	if (el && el.compareDocumentPosition) {
		return function(parent,child) {
			/* jshint -W016 */
			return !!(parent.compareDocumentPosition(child) & 16);
		};
	}
	else if (el && el.contains) {
		return function(parent,child) {
			return parent != child && parent.contains(child);
		};
	}
	else {
		return function(parent,child) {
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

});