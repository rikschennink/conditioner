
/**
 * @class
 * @constructor
 * @augments ExpressionBase
 * @param {BinaryExpression|TestBase|object} expression
 * @param {boolean} negate
 */
var UnaryExpression = function(expression,negate) {

    this._expression = expression instanceof BinaryExpression || expression instanceof UnaryExpression ? expression : null;

    this._config = this._expression ? null : expression;

    this._negate = typeof negate === 'undefined' ? false : negate;

};

UnaryExpression.prototype = Object.create(ExpressionBase);

/**
 * Sets test reference
 * @param {TestBase} test
 */
UnaryExpression.prototype.setTest = function(test) {

    this._expression = test;

};

UnaryExpression.prototype.getConfig = function() {

    return this._config ? [{'expression':this,'config':this._config}] : this._expression.getConfig();

};


/**
 * Tests if valid expression
 * @returns {boolean}
 */
UnaryExpression.prototype.succeeds = function() {

    if (!this._expression.succeeds) {
        return false;
    }

    return this._expression.succeeds() !== this._negate;

};

UnaryExpression.prototype.toString = function() {
    return (this._negate ? 'not ' : '') + (this._expression ? this._expression.toString() : this._config.path + ':{' + this._config.value + '}');
};
