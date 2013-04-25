
/**
 * @class Test
 */
var Test = (function(Observer){

    /**
     * @constructor
     * @param {object} expected - expected conditions to be met
     * @param {Element} [element] - optional element to measure these conditions on
     */
    var Test = function(expected,element) {

        // store expected value
        this._expected = expected;

        // store element
        this._element = element;

        // set default state
        this._state = true;

    };

    Test.inherit = function() {
        var T = function(expected,element) {
            Test.call(this,expected,element);
        };
        T.prototype = Object.create(Test.prototype);
        return T;
    };

    var p = Test.prototype;

    p._test = function(expected) {

        // override in subclass

    };

    p.arrange = function() {

        // override in subclass

    };

    p.assert = function() {

        // call test
        var state = this._test(this._expected);

        // check if result changed
        if (this._state !== state) {
            this._state = state;
            Observer.publish(this,'change',state);
        }

    };

    p.succeeds = function() {
        return this._state;
    };

    return Test;

}(Observer));
