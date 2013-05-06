/**
 * Tests if the window dimensions match certain expectations
 * @module tests/window
 */
define(function() {

    'use strict';

    var _width = 0;

    return {

        setup:function(change) {
            window.addEventListener('resize',change,false);
        },

        change:function() {

            _width = window.innerWidth || document.documentElement.clientWidth;

            return true;
        },

        assert:function(expected) {

            var parts = expected.split(':'),
                key = parts[0],
                value = parseInt(parts[1],10);

            if (key === 'min-width') {
                return _width >= value;
            }
            else if (key === 'max-width') {
                return _width <= value;
            }

            return false;

        }
    };

});
