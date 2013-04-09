define(['./TestBase'],function(TestBase){

    'use strict';

    var Test = TestBase.inherit(),
        p = Test.prototype;

    p.handleEvent = function(e) {
        this.assert();
    };

    p.arrange = function() {
        if (navigator.connection) {
            navigator.connection.addEventListener('change', this, false);
        }
    };

    p._test = function(rule) {
        return rule.value == 'any' && navigator.onLine;
    };

    return Test;

});