/**
 * @class
 * @constructor
 * @augments ExpressionBase
 * @param {UnaryExpression} a
 * @param {String} operator
 * @param {UnaryExpression} b
 */
var BinaryExpression = function(a,operator,b) {

	this._a = a;
	this._operator = operator;
	this._b = b;

};

BinaryExpression.prototype = Object.create(ExpressionBase);

/**
 * Tests if valid expression
 * @returns {Boolean}
 */
BinaryExpression.prototype.succeeds = function() {

	return this._operator === 'and' ?

		// is 'and' operator
		this._a.succeeds() && this._b.succeeds() :

		// is 'or' operator
		this._a.succeeds() || this._b.succeeds();

};

/**
 * Outputs the expression as a string
 * @returns {String}
 */
BinaryExpression.prototype.toString = function() {
	return '(' + this._a.toString() + ' ' + this._operator + ' ' + this._b.toString() + ')';
};

/**
 * Returns the configuration of this expression
 * @returns {Array}
 */
BinaryExpression.prototype.getConfig = function() {

	return [this._a.getConfig(),this._b.getConfig()];

};