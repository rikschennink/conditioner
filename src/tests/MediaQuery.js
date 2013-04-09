define(['./TestBase'],function(TestBase){

    'use strict';

    var Test = TestBase.inherit(),
        p = Test.prototype;

    p._mql = null;

    p.arrange = function() {

        var self = this;
        this._mql = window.matchMedia(this._rules[0].value);
        this._mql.addListener(function(){
            self.assert();
        });

    };

    p._test = function() {
        return this._mql.matches;
    };

    return Test;

});