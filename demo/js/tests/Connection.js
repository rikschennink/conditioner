
define(['Conditioner'],function(Conditioner){

    'use strict';

    var Test = Conditioner.Test.inherit(),
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
