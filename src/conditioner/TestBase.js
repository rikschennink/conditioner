
/**
 * @exports TestBase
 * @constructor
 * @param {string} expected - expected conditions to be met
 * @param {element} element - optional element to measure these conditions on
 * @abstract
 */
var TestBase = function(expected,element) {

    /**
     * Expected conditions to match
     * @type {string}
     * @protected
     */
    this._expected = expected;

    /**
     * Reference to element
     * @type {element}
     * @protected
     */
    this._element = element;

    /**
     * Contains current test state
     * @type {boolean}
     * @private
     */
    this._state = true;

};

TestBase.inherit = function() {
    var T = function(expected,element) {
        TestBase.call(this,expected,element);
    };
    T.prototype = Object.create(TestBase.prototype);
    return T;
};


/**
 * Called to setup the test
 * @abstract
 */
TestBase.prototype.arrange = function() {

    // override in subclass

};


/**
 * @fires change
 * @public
 */
TestBase.prototype.assert = function() {

    // call test
    var state = this._onAssert(this._expected);

    // check if result changed
    if (this._state !== state) {
        this._state = state;
        Observer.publish(this,'change',state);
    }

};


/**
 * Called when asserting the test
 * @param {string} expected - expected value
 * @return {boolean}
 * @abstract
 */
TestBase.prototype._onAssert = function(expected) {
    return false;
};


/**
 * @returns {boolean}
 * @public
 */
TestBase.prototype.succeeds = function() {
    return this._state;
};

