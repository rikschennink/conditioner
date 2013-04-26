
/**
 * @class
 * @constructor
 * @augments ExpressionBase
 * @param {Test|null} test
 */
var UnaryExpression = function(test) {
    this._test = test;
};

UnaryExpression.prototype = Object.create(ExpressionBase);

/**
 * Sets test reference
 * @param {Test} test
 */
UnaryExpression.prototype.setTest = function(test) {
    this._test = test;
};

/**
 * Tests if valid expression
 * @returns {Boolean}
 */
UnaryExpression.prototype.succeeds = function() {
    if (!this._test) {
        return false;
    }
    return this._test.succeeds();
};
