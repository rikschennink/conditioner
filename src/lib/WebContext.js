var TestWrapper = function(query,element,cb) {

	var expression = ExpressionParser.parse(query);
	this._element = element;
	this._tests = expression.getTests();
	this._condition = new Condition(expression,cb);
	this._conditionChangeBind = this._condition.evaluate.bind(this._condition);
	this._load();

};

TestWrapper.prototype = {

	_load:function() {

		// get found test setups from expression and register
		var i = 0;
		var l = this._tests.length;

		for (;i < l;i++) {
			this._setupMonitorForTest(this._tests[i]);
		}

	},

	_setupMonitorForTest:function(test) {

		var self = this;
		var i = 0;
		var l;

		_monitorFactory.create(test,this._element).then(function(watches) {

			// bind watches to test object
			test.assignWatches(watches);

			// add value watches
			l = watches.length;
			for (;i < l;i++) {

				// implement change method on watchers
				// jshint -W083
				watches[i].changed = self._conditionChangeBind;

			}

			// do initial evaluation
			self._condition.evaluate();

		});

	},

	destroy:function() {

		// unload watches
		var i = 0;
		var l = this._tests.length;

		for (;i < l;i++) {
			_monitorFactory.destroy(this._tests[i]);
		}

		// clean bind
		this._conditionChangeBind = null;

	}

};

var WebContext = {

	_uid:0,
	_db:[],

	/**
	 * Removes the given test from the test database and stops testing
	 * @param {Number} id
	 * @returns {Boolean}
	 */
	clearTest:function(id) {

		// check if test with this id is available
		var test = this._db[id];
		if (!test) {
			return false;
		}

		// destroy test
		this._db[id] = null;
		test.destroy();

	},

	/**
	 * Run test and call 'change' method if outcome changes
	 * @param {String} query
	 * @param {Element} element
	 * @param {Function} cb
	 * @returns {Number} test unique id
	 */
	setTest:function(query,element,cb) {

		var id = this._uid++;

		// store test
		this._db[id] = new TestWrapper(query,element,cb);

		// return the identifier
		return id;

	}

};