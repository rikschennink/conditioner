/**
 * @constructor
 */
var ExpressionBase = function() {};

ExpressionBase.prototype = {

	/**
	 * @abstract
	 */
	succeeds:function() {
		// override in subclass
	},

	/**
	 * @abstract
	 */
	getConfig:function() {
		// override in subclass
	}

};