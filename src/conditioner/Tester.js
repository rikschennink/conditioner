/**
 * @param {TestBase} test
 * @param {string} expected
 * @param {element} element
 * @constructor
 */
var Tester = function(test,expected,element) {

    // test and data references
    this._test = test;
    this._expected = expected;
    this._element = element;

    // arrange test
    this._test.arrange(this._expected,this._element);

};

/**
 * Returns true if test assertion successful
 * @returns {boolean}
 */
Tester.prototype.succeeds = function() {
    return this._test.assert(this._expected,this._element);
};
