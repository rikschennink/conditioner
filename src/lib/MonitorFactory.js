var MonitorFactory = function MonitorFactory() {
	this._uid = 1;
	this._db = [];
	this._expressions = [];
};

MonitorFactory.prototype = {

	/**
	 * Parse expression to deduct test names and expected values
	 *
	 * Splits the expression on a comma and splits the resulting blocks at the semi-colon
	 *
	 * @param {String} expression
	 * @param {Boolean} isSingleTest - is true when only one test is defined, in that case only value can be returned
	 * @returns {*}
	 */
	_parse:function(expression,isSingleTest) {

		// if earlier parse action found return that one
		if (this._expressions[expression]) {
			return this._expressions[expression];
		}

		// parse expression
		var i = 0;
		var expressions = expression.split(',');
		var l = expressions.length;
		var result = [];
		var parts;
		var retain;
		var test;

		for (;i < l;i++) {
			parts = expressions[i].split(':');
			retain = parts[0].indexOf('was ') === 0;
			test = retain ? parts[0].substr(4) : parts[0];
			result.push({

				// retain when value matched
				retain: retain,

				// test name
				test: test,

				// expected custom value or expect true by default
				value:isSingleTest ? test : typeof parts[1] === 'undefined' ? true : parts[1]

			});
		}

		// remember the resulting array
		this._expressions[expression] = result;
		return result;
	},

	_mergeData:function(base,expected,element) {
		return mergeObjects(
			{
				element:element,
				expected:expected
			},
			base
		);
	},

	/**
	 * Create a new Monitor based on passed configuration
	 * @param {Test} test
	 * @param {Element} element
	 * @returns {Promise}
	 */
	create:function(test,element) {

		// setup promise
		var p = new Promise();

		// path to monitor
		var path = test.getPath();

		// expected value
		var expected = test.getExpected();

		// load monitor configuration
		var self = this;
		_options.loader.require([_options.paths.monitors + path],function(setup) {

			var i = 0;
			var monitor = self._db[path];
			var id = setup.unload ? self._uid++ : path;
			var l;
			var watch;
			var watches;
			var items;
			var event;
			var item;
			var data;
			var isSingleTest;

			// bind trigger events for this setup if not defined yet
			if (!monitor) {

				// setup
				monitor = {

					// bound watches (each watch has own data object)
					watches:[],

					// change method
					change:function(event) {
						i = 0;
						l = monitor.watches.length;
						for (; i < l; i++) {
							monitor.watches[i].test(event);
						}
					}

				};

				// data holder
				data = setup.unload ? self._mergeData(setup.data,expected,element) : setup.data;

				// if unload method defined
				if (typeof setup.unload === 'function') {
					monitor.unload = (function(data) {
						return function() {
							setup.unload(data);
						};
					}(data));
				}

				// setup trigger events manually
				if (typeof setup.trigger === 'function') {
					setup.trigger(monitor.change,data);
				}

				// auto bind trigger events
				else {
					for (event in setup.trigger) {

						/* istanbul ignore next */
						if (!setup.trigger.hasOwnProperty(event)) {continue;}

						setup.trigger[event].addEventListener(event, monitor.change, false);

					}
				}

				// test if should remember this monitor or should create a new one on each match
				self._db[id] = monitor;
			}

			// remember
			test.assignMonitor(id);

			// add watches
			watches = [];

			// deduce if this setup contains a single test or has a mutiple test setup
			// this is useful to determine parsing setup and watch configuration later on
			isSingleTest = typeof setup.test === 'function';

			// does the monitor have an own custom parse method or should we use the default parse method
			items = setup.parse ? setup.parse(expected,isSingleTest) : self._parse(expected,isSingleTest);

			// cache the amount of items
			l = items.length;

			for (;i < l;i++) {

				item = items[i];

				watch = {

					// on change callback
					changed:null,

					// retain when valid
					retain:item.retain,
					retained: null,

					// default limbo state before we've done any tests
					valid:null,

					// setup data holder for this watcher
					data:setup.unload ? data : self._mergeData(setup.data,item.value,element),

					// setup test method to use
					// jshint -W083
					test:(function(fn) {
						// @ifdef DEV
						if (!fn) {
							throw new Error('Conditioner: Test "' + item.test + '" not found on "' + path + '" Monitor.');
						}
						// @endif
						return function(event) {
							if (this.retained) {return;}
							var state = fn(this.data, event);
							if (this.valid != state) {
								this.valid = state;
								if (this.changed) {
									this.changed();
								}
							}
							if (this.valid && this.retain) {
								this.retained = true;
							}
						};
					}(isSingleTest ? setup.test : setup.test[item.test]))

				};

				// run initial test so we have start state
				watch.test();

				// we need to return it for later binding
				watches.push(watch);
			}

			// add these new watches to the already existing watches so they receive trigger updates
			monitor.watches = monitor.watches.concat(watches);

			// resolve with the new watches
			p.resolve(watches);

		});

		return p;

	},

	destroy:function(test) {

		// get monitor and remove watches contained in this test
		var monitorId = test.getMonitor();
		var	monitor = this._db[monitorId];
		var	monitorWatches = monitor.watches;
		var	l = monitorWatches.length;
		var	i;

		// remove watches
		test.getWatches().forEach(function(watch) {
			for (i = 0;i < l;i++) {
				if (monitorWatches[i] === watch) {
					monitorWatches.splice(i,1);
				}
			}
		});

		// unload monitor, then remove from db
		if (monitor.unload) {
			monitor.unload();
			this._db[monitorId] = null;
		}
	}

};