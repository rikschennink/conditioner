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
    this._onChangeBind = this._onChange.bind(this);
	Observer.subscribe(this._test,'change',this._onChangeBind);

	// arrange test
	this._test.arrange(this._expected,this._element);

};

Tester.prototype = {

    /**
     * Called when the test has changed it's state
     * @private
     */
    _onChange:function() {
        this._changed = true;
    },

    /**
     * Returns true if test assertion successful
     * @returns {Boolean}
     */
    succeeds:function() {

        if (this._changed) {
            this._changed = false;
            this._result = this._test.assert(this._expected,this._element);
        }

        return this._result;

    },

    /**
     * Cleans up object events
     */
    destroy:function() {
        Observer.unsubscribe(this._test,'change',this._onChangeBind);
    }

};