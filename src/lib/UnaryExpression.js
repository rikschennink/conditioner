/**
 * @class
 * @constructor
 * @param {UnaryExpression|BinaryExpression|Test} expression
 * @param {Boolean} negate
 */
var UnaryExpression = function UnaryExpression(expression,negate) {

	this._expression = expression;
	this._negate = typeof negate === 'undefined' ? false : negate;

};

UnaryExpression.prototype = {

	/**
	 * Tests if valid expression
	 * @returns {Boolean}
	 */
	isTrue:function() {
		return this._expression.isTrue() !== this._negate;
	},

	/**
	 * Returns tests contained in this expression
	 * @returns Array
	 */
	getTests:function() {
		return this._expression instanceof Test ? [this._expression] : this._expression.getTests();
	},

	/**
	 * Cast to string
	 * @returns {string}
	 */
	toString:function() {
		return (this._negate ? 'not ' : '') + this._expression.toString();
	}
};