var TestFactory = {

	_tests:{},

    /**
     * Creates a Test Class based on a given path and test configuration
     * @param path
     * @param config
     * @returns {Test}
     * @private
     */
	_createTest:function(path,config) {

		if (!config.assert) {
			throw new Error('TestRegister._addTest(path,config): "config.assert" is a required parameter.');
		}

		// create Test Class
		var Test = function(){};

		// setup static methods and properties
		Test.supported = 'support' in config ? config.support() : true;
		Test._callbacks = [];
		Test._ready = false;

		Test._setup = function(test) {

			// if test is not supported stop here
			if (!Test.supported){return;}

			// push reference to test act method
			Test._callbacks.push(test.onchange.bind(test));

			// if setup done
			if (Test._ready) {return;}

			// Test is about to be setup
			Test._ready = true;

			// call test setup method
			config.setup.call(Test,Test._measure);

		};

		Test._measure = function(e) {

			// call change method if defined
			var changed = 'measure' in config ? config.measure.call(Test._measure,e) : true;

			// if result of measurement was a change
			if (changed) {
				var i=0,l=Test._callbacks.length;
				for (;i<l;i++) {
					Test._callbacks[i](e);
				}
			}

		};

		// setup instance methods
		Test.prototype.supported = function() {
			return Test.supported;
		};

		// set change publisher
		Test.prototype.onchange = function() {
			Observer.publish(this,'change');
		};

		// set custom or default arrange method
		if (config.arrange) {
			Test.prototype.arrange = function(expected,element) {

				// if no support, don't arrange
				if (!Test.supported) {return;}

				// arrange this test using the supplied arrange method
				config.arrange.call(this,expected,element);
			};
		}
		else {
			Test.prototype.arrange = function() {
				Test._setup(this);
			};
		}

		// override act method if necessary
		if (config.measure) {
			Test.prototype.measure = config.measure;
		}

		// set assert method
		Test.prototype.assert = config.assert;

		// return reference
		return Test;
	},

    /**
     * Searches in cache for a test with the supplied path
     * @param path
     * @returns {Test}
     * @private
     */
	_findTest:function(path) {
		return this._tests[path];
	},

    /**
     * Remebers a test for the given path
     * @param {String} path
     * @param {Test} Test
     * @private
     */
	_storeTest:function(path,Test) {
		this._tests[path] = Test;
	},

    /**
     * Loads the test with the geiven path
     * @param {String} path - path to test
     * @param {function} success - callback method, will be called when test found and instantiated
     */
	getTest:function(path,success) {

		path = './tests/' + path;

        _options.loader([path],function(config){

			var Test = TestFactory._findTest(path);
			if (!Test) {

				// create the test
				Test = TestFactory._createTest(path,config);

				// remember this test
				TestFactory._storeTest(path,Test);
			}

            success(new Test());

		});
	}
};