/**
 * Test
 * @param {String} path to monitor
 * @param {String} expected value
 * @constructor
 */
var Test = function Test(path,expected) {

	this._path = path;
	this._expected = expected;
	this._watches = [];
	this._count = 0;
	this._monitor = null;

};

Test.prototype = {

	/**
	 * Returns a path to the required monitor
	 * @returns {String}
	 */
	getPath:function() {
		return this._path;
	},

	/**
	 * Returns the expected value
	 * @returns {String}
	 */
	getExpected:function() {
		return this._expected;
	},

	/**
	 * Returns true if none of the watches return a false state
	 * @returns {Boolean}
	 */
	isTrue:function() {
		var i = 0;
		var l = this._count;

		for (;i < l;i++) {
			if (!this._watches[i].valid) {
				return false;
			}
		}
		return true;
	},

	/**
	 * Related monitor
	 * @param {String|Number} monitor
	 */
	assignMonitor:function(monitor) {
		this._monitor = monitor;
	},

	/**
	 * Assigns a new watch for this test
	 * @param watches
	 */
	assignWatches:function(watches) {
		this._watches = watches;
		this._count = watches.length;
	},

	getMonitor:function() {
		return this._monitor;
	},

	/**
	 * Returns watches assigned to this test
	 * @returns {Array}
	 */
	getWatches:function() {
		return this._watches;
	},

	/**
	 * Returns test in path
	 * @returns {String}
	 */
	toString:function() {
		return this._path + ':{' + this._expected + '}';
	}

};