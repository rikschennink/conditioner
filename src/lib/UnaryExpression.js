/**
 * @class
 * @constructor
 * @param {UnaryExpression|BinaryExpression|Test} expression
 * @param {Boolean} negate
 */
var UnaryExpression = function(expression,negate) {

	this._expression = expression;
	this._negate = typeof negate === 'undefined' ? false : negate;

};

/**
 * Tests if valid expression
 * @returns {Boolean}
 */
UnaryExpression.prototype.isTrue = function() {
	return this._expression.isTrue() !== this._negate;
};

/**
 * Returns tests contained in this expression
 * @returns Array
 */
UnaryExpression.prototype.getTests = function() {
    return this._expression instanceof Test ? [this._expression] : this._expression.getTests();
};

/**
 * Cast to string
 * @returns {string}
 */
UnaryExpression.prototype.toString = function() {
	return (this._negate ? 'not ' : '') + this._expression.toString();
};