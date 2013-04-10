
/**
 * Tests if the window dimensions match certain expectations
 * @module tests/Window
 */
define(['Conditioner'],function(Conditioner){

    'use strict';

    var Test = Conditioner.Test.inherit(),
    p = Test.prototype;

    p.handleEvent = function(e) {
        this.assert();
    };

    p.arrange = function() {
        window.addEventListener('resize',this,false);
    };

    p._test = function(rule) {

        var innerWidth = window.innerWidth || document.documentElement.clientWidth;

        switch(rule.key) {
            case 'min-width':{
                return innerWidth >= rule.value;
            }
            case 'max-width':{
                return innerWidth <= rule.value;
            }
        }

        return true;
    };

    return Test;

});
