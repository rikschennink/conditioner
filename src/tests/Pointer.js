
/**
 * Tests if the user is using a pointer device
 * @module tests/pointer
 */
define(['Conditioner'],function(Conditioner){

    'use strict';

    var Test = Conditioner.Test.inherit(),
    p = Test.prototype,
    MOUSE_MOVES_REQUIRED = 2;

    p._totalMouseMoves = 0;

    p.handleEvent = function(e) {
        if (e.type == 'mousemove') {
            this._totalMouseMoves++;
            if (this._totalMouseMoves >= MOUSE_MOVES_REQUIRED) {
                document.removeEventListener('mousemove',this,false);
                document.removeEventListener('mousedown',this,false);
            }
        }
        else {
            this._totalMouseMoves = 0;
        }
        this.assert();
    };

    p.arrange = function() {

        // start listening to mousemoves to deduct the availability of a pointer device
        document.addEventListener('mousemove',this,false);
        document.addEventListener('mousedown',this,false);

        // start timer, stop testing after 10 seconds
        var self = this;
        setTimeout(function(){
            document.removeEventListener('mousemove',self,false);
            document.removeEventListener('mousedown',self,false);
        },10000);
    };

    p._test = function(rule) {
        return (this._totalMouseMoves >= MOUSE_MOVES_REQUIRED) === rule.value;
    };

    return Test;

});
