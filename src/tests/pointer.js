/**
 * Tests if the user is using a pointer device
 * @module tests/pointer
 */
define(function(){

    'use strict';

    var _moves = 0;
    var _movesRequired = 2;

    return {

        setup:function(change){

            // start listening to mousemoves to deduce the availability of a pointer device
            document.addEventListener('mousemove',change,false);
            document.addEventListener('mousedown',change,false);

            // start timer, stop testing after 30 seconds
            var self = this;
            setTimeout(function(){
                document.removeEventListener('mousemove',change,false);
                document.removeEventListener('mousedown',change,false);
            },30000);

        },

        change:function(e,change) {

            if (e.type === 'mousemove') {

                _moves++;

                if (_moves >= _movesRequired) {

                    // stop listening to events
                    document.removeEventListener('mousemove',change,false);
                    document.removeEventListener('mousedown',change,false);

                    // change
                    return true;
                }
            }
            else {
                _moves = 0;
            }

            // no change
            return false;
        },

        assert:function(expected) {
            return expected === 'available' && _moves>=_movesRequired;
        }
    };

});
