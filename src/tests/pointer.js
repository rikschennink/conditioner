/**
 * Tests if the user is using a pointer device
 * @module tests/pointer
 */
define(function(){

    'use strict';

    var _moves = 0;
    var _movesRequired = 2;

    return {

        /**
         * Setup events, detach events if no activity for 30 seconds
         * @param {function} measure
         */
        setup:function(measure){

            // start listening to mousemoves to deduce the availability of a pointer device
            document.addEventListener('mousemove',measure,false);
            document.addEventListener('mousedown',measure,false);

            // start timer, stop testing after 30 seconds
            setTimeout(function(){
                document.removeEventListener('mousemove',measure,false);
                document.removeEventListener('mousedown',measure,false);
            },30000);

        },

        /**
         * Custom measure function to count the amount of moves
         * @param {Event} e
         * @returns {boolean} - Return true if a change has occurred
         */
        measure:function(e) {

            if (e.type === 'mousemove') {

                _moves++;

                if (_moves >= _movesRequired) {

                    // stop listening to events
                    document.removeEventListener('mousemove',this,false);
                    document.removeEventListener('mousedown',this,false);

                    return true;
                }
            }
            else {
                _moves = 0;
            }

            return false;
        },

        /**
         * test if matches expectations
         * @param {string} expected
         * @returns {boolean}
         */
        assert:function(expected) {
            return expected === 'available' && _moves>=_movesRequired;
        }
    };

});
