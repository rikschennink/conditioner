/**
 * @param {TestBase} test
 * @param {string} expected
 * @param {element} element
 * @constructor
 */
var Tester = function(test,expected,element) {

    this._result = null;

    this._test = test;
    this._expected = expected;
    this._element = element;

    // if the test changed we forget the previous results
    Observer.subscribe(this._test,'change',this._onChange.bind(this));

};

/**
 * Test environment has changed and needs to be re-asserted
 * @param {Event} e
 * @private
 */
Tester.prototype._onChange = function(e) {
    this._result = null;
};

/**
 * Returns true if test assertion successful
 * @returns {boolean}
 */
Tester.prototype.succeeds = function() {

    // if result not set, assert
    if (this._result===null) {
        this._result = this._test.assert(this._expected,this._element);
    }

    // return the test result
    return this._result;

};
