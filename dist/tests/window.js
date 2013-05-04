/**
 * Tests if the window dimensions match certain expectations
 * @module tests/window
 */
define(['conditioner'],function(conditioner){

    'use strict';

    return {
        arrange:function() {

            window.addEventListener('resize',this,false);

        },
        assert:function(expected) {

            var innerWidth = window.innerWidth || document.documentElement.clientWidth,
                parts = expected.split(':'),
                key = parts[0],
                value = parseInt(parts[1],10);

            if (key === 'min-width') {
                return innerWidth >= value;
            }
            else if (key === 'max-width') {
                return innerWidth <= value;
            }

            return false;

        }
    };

});
