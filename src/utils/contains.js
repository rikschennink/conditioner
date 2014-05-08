(function(win,doc,undefined) {

    'use strict';

	// define contains method based on browser capabilities
	var el = doc ? doc.body : null,exports;
	if (el && el.compareDocumentPosition) {
        exports = function(parent,child) {
			/* jshint -W016 */
			return !!(parent.compareDocumentPosition(child) & 16);
		};
	}
	else if (el && el.contains) {
        exports = function(parent,child) {
			return parent != child && parent.contains(child);
		};
	}
	else {
        exports = function(parent,child) {
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
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function(){return exports;});
    }
    // Browser globals
    else {
        win.contains = exports;
    }

}(window,document));