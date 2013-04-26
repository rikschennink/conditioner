
/**
 * @class
 * @constructor
 * @augments ExpressionBase
 * @param {UnaryExpression} a
 * @param {string} o
 * @param {UnaryExpression} b
 */
var BinaryExpression = function(a,o,b) {
    this._a = a;
    this._o = o;
    this._b = b;
};

BinaryExpression.prototype = Object.create(ExpressionBase);

/**
 * Tests if valid expression
 * @returns {Boolean}
 */
BinaryExpression.prototype.succeeds = function() {

    return this._o==='and' ?

        // is 'and' operator
        this._a.succeeds() && this._b.succeeds() :

        // is 'or' operator
        this._a.succeeds() || this._b.succeeds();

};

