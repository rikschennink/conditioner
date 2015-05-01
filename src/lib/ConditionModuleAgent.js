var ConditionModuleAgent = function ConditionModuleAgent(conditions,element) {

	// if no conditions, conditions will always be suitable
	if (typeof conditions !== 'string' || !conditions.length) {
		return;
	}

	this._conditions = conditions;
	this._element = element;
	this._state = false;
	this._test = null;

};

ConditionModuleAgent.prototype = {

	/**
	 * Initialize, resolve on first test results
	 * @returns {Promise}
	 */
	init:function(ready) {

		var self = this;
		var init = false;

		this._test = WebContext.setTest(this._conditions,this._element,function(valid) {

			// something changed
			self._state = valid;

			// notify others of this state change
			Observer.publish(self,'change');

			// call ready
			if (!init) {
				init = true;
				ready();
			}

		});

	},

	/**
	 * Returns true if the current conditions allow module activation
	 * @return {Boolean}
	 * @public
	 */
	allowsActivation:function() {
		return this._state;
	},

	/**
	 * Cleans up event listeners and readies object for removal
	 */
	destroy:function() {

		// stop measuring
		WebContext.clearTest(this._test);

	}

};