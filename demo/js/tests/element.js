/**
 * Tests if an elements dimensions match certain expectations
 * @module tests/element
 */
define(['conditioner'],function(conditioner){

    'use strict';

    var _isVisible = function(element) {
        var viewHeight = window.innerHeight,
        bounds = element.getBoundingClientRect();
        return (bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight);
    };

    return {
        arrange:function() {

            // arrange
            window.addEventListener('resize',this,false);
            window.addEventListener('scroll',this,false);

        },
        assert:function(expected,element) {

            // assert
            var parts = expected.split(':'),key,value;

            if (parts) {
                key = parts[0];
                value = parseInt(parts[1],10);
            }
            else {
                key = expected;
            }

            if (key === 'min-width') {
                return element.offsetWidth >= value;
            }
            else if (key === 'max-width') {
                return element.offsetWidth <= value;
            }
            else if (key === 'visible') {
                return _isVisible(element);
            }
            else if (key === 'seen') {

                var hasBeenSeen = this.remember(['seen',element]);
                if (!hasBeenSeen) {
                    hasBeenSeen = _isVisible(element);
                    if (hasBeenSeen) {
                        this.remember(['seen',element],true);
                    }
                }

                return hasBeenSeen;
            }

            return false;

        }
    };

});
