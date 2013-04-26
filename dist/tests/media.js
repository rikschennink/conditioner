
/**
 * Tests if a media query is matched or not and listens to changes
 * @module tests/media
 */
define(['Conditioner'],function(Conditioner){

    'use strict';

    var Test = Conditioner.TestBase.inherit(),
    p = Test.prototype;

    p.arrange = function() {

        if (!window.matchMedia) {
            return;
        }

        var self = this;
        this._mql = window.matchMedia(this._expected);
        this._mql.addListener(function(){
            self.assert();
        });

    };

    p._test = function(expected) {

        // see if checking if supported
        if (expected === 'supported') {
            return typeof this._mql !== 'undefined';
        }

        // if no media query list defined, no support
        if (typeof this._mql === 'undefined') {
            return false;
        }

        // test media query
        return this._mql.matches;
    };

    return Test;

});
