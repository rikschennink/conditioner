
/**
 * Tests if an elements dimensions match certain expectations
 * @module tests/element
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
        window.addEventListener('scroll',this,false);
    };

    p._test = function(rule) {

        switch(rule.key) {
            case 'min-width':{
                return this._element.offsetWidth >= rule.value;
            }
            case 'max-width':{
                return this._element.offsetWidth <= rule.value;
            }
            case 'visible':{
                var viewHeight = window.innerHeight;
                var bounds = this._element.getBoundingClientRect();
                return ((bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight)) === rule.value;
            }
        }

        return true;
    };

    return Test;

});
