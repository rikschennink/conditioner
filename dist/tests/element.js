
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

    p._test = function(expected) {

        var parts = expected.split(':'),key,value;
        if (parts) {
            key = parts[0];
            value = parseInt(parts[1],10);
        }
        else {
            key = expected;
        }

        switch(key) {
            case 'min-width':{
                return this._element.offsetWidth >= value;
            }
            case 'max-width':{
                return this._element.offsetWidth <= value;
            }
            case 'seen':{
                return this._seen === true;
            }
            case 'visible':{

                // test is element is visible
                var viewHeight = window.innerHeight,
                    bounds = this._element.getBoundingClientRect(),
                    visible = (bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight);

                // remember if seen
                if (!this._seen && visible) {
                    this._seen = true;
                }

                // let know if visible
                return visible;
            }
        }

        return true;
    };

    return Test;

});
