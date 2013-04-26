
/**
 * @exports Test
 * @constructor
 * @param {object} expected - expected conditions to be met
 * @param {Element} [element] - optional element to measure these conditions on
 * @abstract
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

/**
 * Called to run the test
 * @param {string} expected - expected value
 * @private
 */
Test.prototype._test = function(expected) {

    // override in subclass

};

/**
 * Called to setup the test
 */
Test.prototype.arrange = function() {

    // override in subclass

};

Test.prototype.assert = function() {

    // call test
    var state = this._test(this._expected);

    // check if result changed
    if (this._state !== state) {
        this._state = state;
        Observer.publish(this,'change',state);
    }

};

Test.prototype.succeeds = function() {
    return this._state;
};

