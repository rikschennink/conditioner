define(['conditioner/Observer'],function(Observer){

    'use strict';

    var Test = function(expected,element) {

        // store element
        this._element = element;

        // set default state
        this._state = true;

        // rules to test
        this._rules = [];

        // transform expected object into separate rules
        if (expected instanceof Array || typeof expected != 'object') {
            this._addRule(expected);
        }
        else if (typeof expected == 'object') {
            for (var key in expected) {
                if (!expected.hasOwnProperty(key)){continue;}
                this._addRule(expected[key],key);
            }
        }

    };

    Test.inherit = function() {
        var T = function(expected,element) {
            Test.call(this,expected,element);
        };
        T.prototype = Object.create(Test.prototype);
        return T;
    };

    var p = Test.prototype;

    p._addRule = function(value,key) {

        if (!value) {
            throw new Error('TestBase._addRule(value,key): "value" is a required parameter.');
        }

        this._rules.push({
            'key':typeof key == 'undefined' ? 'default' : key,
            'value':value
        });

    };

    p._test = function(rule) {

        // override in subclass

    };

    p.arrange = function() {

        // override in subclass

    };

    p.assert = function() {

        var i=0,l=this._rules.length,result = true;
        for (;i<l;i++) {
            if (!this._test(this._rules[i])) {
                result = false;
                break;
            }
        }

        if (this._state!= result) {
            this._state = result;
            Observer.publish(this,'change',result);
        }

    };

    p.succeeds = function() {
        return this._state;
    };

    return Test;

});