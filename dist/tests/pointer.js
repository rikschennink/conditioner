/**
 * Tests if the user is using a pointer device
 * @module tests/pointer
 */
define(['conditioner'],function(conditioner){

    'use strict';

    return {
        arrange:function() {

            this.remember('moves',0);
            this.remember('moves-required',2);

            // start listening to mousemoves to deduce the availability of a pointer device
            document.addEventListener('mousemove',this,false);
            document.addEventListener('mousedown',this,false);

            // start timer, stop testing after 30 seconds
            var self = this;
            setTimeout(function(){
                document.removeEventListener('mousemove',self,false);
                document.removeEventListener('mousedown',self,false);
            },30000);

        },
        act:function(e) {

            if (e.type === 'mousemove') {

                var moves = this.remember('moves');
                    moves++;
                this.remember('moves',moves);

                if (moves >= this.remember('moves-required')) {

                    // stop listening to events
                    document.removeEventListener('mousemove',this,false);
                    document.removeEventListener('mousedown',this,false);

                    // mouse now detected
                    conditioner.Observer.publish(this,'change');
                }
            }
            else {
                this.remember('moves',0);
            }

        },
        assert:function(expected) {

            var result = null;
            if (this.remember('moves') >= this.remember('moves-required')) {
                result = 'available';
            }

            return result === expected;
        }
    };

});
