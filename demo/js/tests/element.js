
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

        if (key==='min-width') {
            return this._element.offsetWidth >= value;
        }
        else if (key==='max-width') {
            return this._element.offsetWidth <= value;
        }
        else if (key==='seen' || key ==='visible') {

            // test is element is visible
            var viewHeight = window.innerHeight,
                bounds = this._element.getBoundingClientRect(),
                visible = (bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight);

            if (key === 'seen') {

                // remember if seen
                if (typeof this._seen === 'undefined' && visible) {
                    this._seen = true;
                }

                // if seen
                return this._seen === true;
            }

            if (key === 'visible') {
                return visible;
            }
        }

        return true;
    };

    return Test;

});
