
/**
 * Tests if a media query is matched or not and listens to changes
 * @module tests/media
 */
define(['Conditioner'],function(Conditioner){

    'use strict';

    var Test = Conditioner.Test.inherit(),
    p = Test.prototype;

    p._mql = null;

    p.arrange = function() {

        var self = this;
        this._mql = window.matchMedia(this._expected);
        this._mql.addListener(function(){
            self.assert();
        });

    };

    p._test = function() {
        return this._mql.matches;
    };

    return Test;

});
