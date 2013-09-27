define(function() {

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

	// if method found use native matchesSelector
	if (_method) {
		return function(element,selector) {
			return element[_method](selector);
		};
	}

	// check if an element matches a CSS selector
	// https://gist.github.com/louisremi/2851541
	return function(element,selector) {

		// We'll use querySelectorAll to find all element matching the selector,
		// then check if the given element is included in that list.
		// Executing the query on the parentNode reduces the resulting nodeList,
		// document doesn't have a parentNode, though.
		var nodeList = (element.parentNode || document).querySelectorAll(selector) || [],
			i = nodeList.length;

		// loop through nodeList
		while (i--) {
			if (nodeList[i] == element) {return true;}
		}
		return false;
	};

});