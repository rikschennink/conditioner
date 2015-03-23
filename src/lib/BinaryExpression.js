/**
 * @class
 * @constructor
 * @param {UnaryExpression} a
 * @param {String} operator
 * @param {UnaryExpression} b
 */
var BinaryExpression = function BinaryExpression(a,operator,b) {

	this._a = a;
	this._operator = operator;
	this._b = b;

};

BinaryExpression.prototype = {

	/**
	 * Tests if valid expression
	 * @returns {Boolean}
	 */
	isTrue:function() {

		return this._operator === 'and' ?

			// is 'and' operator
			this._a.isTrue() && this._b.isTrue() :

			// is 'or' operator
			this._a.isTrue() || this._b.isTrue();

	},

	/**
	 * Returns tests contained in this expression
	 * @returns Array
	 */
	getTests:function() {
		return this._a.getTests().concat(this._b.getTests());
	},

	/**
	 * Outputs the expression as a string
	 * @returns {String}
	 */
	toString:function() {
		return '(' + this._a.toString() + ' ' + this._operator + ' ' + this._b.toString() + ')';
	}

};