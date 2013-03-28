define(function() {

    var Matcher = {

        elementMatchesSelector:function(element,selector) {

        }
    }






});


/* matches helper */
var _matchesMethod = null;
var _matchesSelector = function(element,selector) {

    if (!element) {
        return false;
    }

    if (!_matchesMethod) {
        var el = document.body;
        if (el.matches) {
            _matchesMethod = 'matches';
        }
        else if (el.webkitMatchesSelector) {
            _matchesMethod = 'webkitMatchesSelector';
        }
        else if (el.mozMatchesSelector) {
            _matchesMethod = 'mozMatchesSelector';
        }
        else if (el.msMatchesSelector) {
            _matchesMethod = 'msMatchesSelector';
        }
        else if (el.oMatchesSelector) {
            _matchesMethod = 'oMatchesSelector';
        }
    }

    return element[_matchesMethod](selector);
};
