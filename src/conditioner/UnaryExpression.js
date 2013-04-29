
/**
 * @class
 * @constructor
 * @augments ExpressionBase
 * @param {BinaryExpression|Test|null} expression
 * @param {boolean} negate
 */
var UnaryExpression = function(expression,negate) {

    /**
     * @type {BinaryExpression|Test|null}
     * @private
     */
    this._expression = expression;
    this._negate = typeof negate === 'undefined' ? false : negate;

};

UnaryExpression.prototype = Object.create(ExpressionBase);

/**
 * Sets test reference
 * @param {Test} test
 */
UnaryExpression.prototype.setTest = function(test) {

    this._expression = test;

};

/**
 * Tests if valid expression
 * @returns {Boolean}
 */
UnaryExpression.prototype.succeeds = function() {

    if (!this._expression) {
        return false;
    }

    return this._expression.succeeds() !== this._negate;

};
