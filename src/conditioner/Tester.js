/**
 * @param {function} test
 * @param {String} expected
 * @param {Element} element
 * @constructor
 */
var Tester = function(test,expected,element) {

	// test and data references
	this._test = test;
	this._expected = expected;
	this._element = element;

	// cache result
	this._result = false;
	this._changed = true;

	// listen to changes on test
	var self = this;
	Observer.subscribe(this._test,'change',function(){
		self._changed = true;
	});

	// arrange test
	this._test.arrange(this._expected,this._element);

};

/**
 * Returns true if test assertion successful
 * @returns {Boolean}
 */
Tester.prototype.succeeds = function() {

	if (this._changed) {
		this._changed = false;
		this._result = this._test.assert(this._expected,this._element);
	}

	return this._result;
};