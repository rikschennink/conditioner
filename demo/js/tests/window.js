/**
 * Tests if the window dimensions match certain expectations
 * @module tests/window
 */
define(['Conditioner'],function(Conditioner){

    'use strict';

    var Test = Conditioner.TestBase.inherit(),
    p = Test.prototype;

    p.handleEvent = function(e) {
        this.assert();
    };

    p.arrange = function() {
        window.addEventListener('resize',this,false);
    };

    p._onAssert = function(expected) {

        var innerWidth = window.innerWidth || document.documentElement.clientWidth,
            parts = expected.split(':'),
            key = parts[0],
            value = parseInt(parts[1],10);

        switch(key) {
            case 'min-width':{
                return innerWidth >= value;
            }
                break;
            case 'max-width':{
                return innerWidth <= value;
            }
        }

        return false;
    };

    return Test;

});
