var Condition = function Condition(expression,callback) {

	// get expression
	this._expression = expression;

	// on detect change callback
	this._change = callback;

	// default state is limbo
	this._currentState = null;

};

Condition.prototype = {

	/**
	 * Evaluate expression, call change method if there's a diff with the last evaluation
	 */
	evaluate:function() {
		var state = this._expression.isTrue();
		if (state != this._currentState) {
			this._currentState = state;
			this._change(state);
		}
	}

};