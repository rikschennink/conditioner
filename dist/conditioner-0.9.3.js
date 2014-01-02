
define('conditioner/Observer',[],function(){

    var _uid = 1, // start at 1 because !uid returns false when uid===0
        _db = {};

    return {

        _setEntry:function(obj,prop) {

            var uid = obj.__pubSubUID;
            if (!uid) {
                uid = _uid++;
                obj.__pubSubUID = uid;
                _db[uid] = {
                    'obj':obj
                };
            }

            if (!_db[uid][prop]) {
                _db[uid][prop] = [];
            }

            return _db[uid];
        },

        _getEntryProp:function(obj,prop) {
            var entry = _db[obj.__pubSubUID];
            return entry ? _db[obj.__pubSubUID][prop] : null;
        },

        /**
         * Subscribe to an event
         * @memberof Observer
         * @param {Object} obj - Object to subscribe to
         * @param {String} type - Event type to listen for
         * @param {Function} fn - Function to call when event fires
         * @static
         */
        subscribe:function(obj,type,fn) {

            var entry = this._setEntry(obj,'subscriptions');

            // check if already added
            var sub,i=0,subs=entry.subscriptions,l=subs.length;
            for (; i<l; i++) {
                sub = subs[i];
                if (sub.type === type && sub.fn === fn) {
                    return;
                }
            }

            // add event
            subs.push({'type':type,'fn':fn});
        },

        /**
         * Unsubscribe from further notifications
         * @memberof Observer
         * @param {Object} obj - Object to unsubscribe from
         * @param {String} type - Event type to match
         * @param {Function} fn - Function to match
         * @static
         */
        unsubscribe:function(obj,type,fn) {

            var subs = this._getEntryProp(obj,'subscriptions');
            if (!subs) {return;}

            // find and remove
            var sub,i=subs.length;
            while (--i >= 0) {
                sub = subs[i];
                if (sub.type === type && (sub.fn === fn || !fn)) {
                    subs.splice(i,1);
                }
            }
        },

        /**
         * Publishes an event async
         * http://ejohn.org/blog/how-javascript-timers-work/
         * @param {Object} obj - Object to fire the event on
         * @param {String} type - Event type to fire
         * @param {Object} [data] - optional data carrier
         * @static
         */
        publishAsync:function(obj,type,data) {
            var self = this;
            setTimeout(function(){
                self.publish(obj,type,data);
            },0);
        },

        /**
         * Publish an event
         * @memberof Observer
         * @param {Object} obj - Object to fire the event on
         * @param {String} type - Event type to fire
         * @param {Object} [data] - optional data carrier
         * @static
         */
        publish:function(obj,type,data) {

            var entry = this._setEntry(obj,'subscriptions');

            // find and execute callback
            var matches=[],i=0,subs=entry.subscriptions,l=subs.length,receivers = entry.receivers,sub;
            for (;i<l;i++) {
                sub = subs[i];
                if (sub.type === type) {
                    matches.push(sub);
                }
            }

            // execute matched callbacks
            l = matches.length;
            for (i=0;i<l;i++) {
                matches[i].fn(data);
            }

            // see if any receivers should be informed
            if (!receivers) {
                return;
            }

            l = receivers.length;
            for (i=0;i<l;i++) {
                this.publish(receivers[i],type,data);
            }
        },

        /**
         * Setup propagation target for events so they can bubble up the object tree
         * @memberof Observer
         * @param {Object} informant - Object to set as origin
         * @param {Object} receiver - Object to set as target
         * @return {Boolean} if setup was successful
         * @static
         */
        inform:function(informant,receiver) {

            if (!informant || !receiver) {
                return false;
            }

            var entry = this._setEntry(informant,'receivers');
            entry.receivers.push(receiver);

            return true;
        },

        /**
         * Remove propagation target
         * @memberof Observer
         * @param {Object} informant - Object set as origin
         * @param {Object} receiver - Object set as target
         * @return {Boolean} if removal was successful
         * @static
         */
        conceal:function(informant,receiver) {

            if (!informant || !receiver) {
                return false;
            }

            var receivers = this._getEntryProp(informant,'receivers');
            if (!receivers) {
                return false;
            }

            // find and remove
            var i=receivers.length,item;
            while (--i >= 0) {
                item = receivers[i];
                if (item === receiver) {
                    receivers.splice(i,1);
                    return true;
                }
            }

            return false;
        }
    }

});
define('conditioner/contains',[],function() {

	// define contains method based on browser capabilities
	var el = document ? document.body : null;
	if (el && el.compareDocumentPosition) {
		return function(parent,child) {
			/* jshint -W016 */
			return !!(parent.compareDocumentPosition(child) & 16);
		};
	}
	else if (el && el.contains) {
		return function(parent,child) {
			return parent != child && parent.contains(child);
		};
	}
	else {
		return function(parent,child) {
			var node = child.parentNode;
			while (node) {
				if (node === parent) {
					return true;
				}
				node = node.parentNode;
			}
			return false;
		};
	}

});
define('conditioner/matchesSelector',[],function() {

	// define method used for matchesSelector
	var _matchesSelector = null,_method = null,el = document ? document.body : null;
	if (!el || el.matches) {
		_method = 'matches';
	}
	else if (el.webkitMatchesSelector) {
		_method = 'webkitMatchesSelector';
	}
	else if (el.mozMatchesSelector) {
		_method = 'mozMatchesSelector';
	}
	else if (el.msMatchesSelector) {
		_method = 'msMatchesSelector';
	}
	else if (el.oMatchesSelector) {
		_method = 'oMatchesSelector';
	}

	// if method found use native matchesSelector
	if (_method) {
		return function(element,selector) {
			return element[_method](selector);
		};
	}

	// check if an element matches a CSS selector
	// https://gist.github.com/louisremi/2851541
	return function(element,selector) {

		// We'll use querySelectorAll to find all element matching the selector,
		// then check if the given element is included in that list.
		// Executing the query on the parentNode reduces the resulting nodeList,
		// document doesn't have a parentNode, though.
		var nodeList = (element.parentNode || document).querySelectorAll(selector) || [],
			i = nodeList.length;

		// loop through nodeList
		while (i--) {
			if (nodeList[i] == element) {return true;}
		}
		return false;
	};

});
define('conditioner/mergeObjects',[],function(){
	var exports = function(target, src) {

		var array = Array.isArray(src);
		var dst = array && [] || {};

		src = src || {};

		if (array) {

			target = target || [];
			dst = dst.concat(target);

			src.forEach(function(e, i) {

				if (typeof e === 'object') {
					dst[i] = exports(target[i], e);
				}
				else {
					if (target.indexOf(e) === -1) {
						dst.push(e);
					}
				}
			});
		}
		else {

			if (target && typeof target === 'object') {

				Object.keys(target).forEach(function (key) {
					dst[key] = target[key];
				});

			}

			Object.keys(src).forEach(function (key) {

				if (typeof src[key] !== 'object' || !src[key]) {
					dst[key] = src[key];
				}
				else {
					if (!target[key]) {
						dst[key] = src[key];
					}
					else {
						dst[key] = exports(target[key], src[key]);
					}
				}

			});
		}

		return dst;
	};

	return exports;
});
// conditioner v0.9.3 - ConditionerJS - Frizz free, environment-aware, javascript modules.
// Copyright (c) 2014 Rik Schennink - http://conditionerjs.com
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
define(['require','conditioner/Observer','conditioner/contains','conditioner/matchesSelector','conditioner/mergeObjects'],function(require,Observer,contains,matchesSelector,mergeObjects) {

	

	/**
	 * @module conditioner
	 */
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
	/**
	 * @class
	 * @constructor
	 * @augments ExpressionBase
	 * @param {BinaryExpression|Tester|object} expression
	 * @param {Boolean} negate
	 */
	var UnaryExpression = function(expression,negate) {

		this._expression = expression instanceof BinaryExpression || expression instanceof UnaryExpression ? expression : null;

		this._config = this._expression ? null : expression;

		this._negate = typeof negate === 'undefined' ? false : negate;

	};

	UnaryExpression.prototype = Object.create(ExpressionBase);

	/**
	 * Sets test reference
	 * @param {Tester} tester
	 */
	UnaryExpression.prototype.assignTester = function(tester) {

		this._expression = tester;

	};

	UnaryExpression.prototype.getConfig = function() {

		return this._config ? [{'expression':this,'config':this._config}] : this._expression.getConfig();

	};

	/**
	 * Tests if valid expression
	 * @returns {Boolean}
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
	/**
	 * @class
	 * @constructor
	 * @augments ExpressionBase
	 * @param {UnaryExpression} a
	 * @param {String} operator
	 * @param {UnaryExpression} b
	 */
	var BinaryExpression = function(a,operator,b) {

		this._a = a;
		this._operator = operator;
		this._b = b;

	};

	BinaryExpression.prototype = Object.create(ExpressionBase);

	/**
	 * Tests if valid expression
	 * @returns {Boolean}
	 */
	BinaryExpression.prototype.succeeds = function() {

		return this._operator === 'and' ?

			// is 'and' operator
			this._a.succeeds() && this._b.succeeds() :

			// is 'or' operator
			this._a.succeeds() || this._b.succeeds();

	};

	/**
	 * Outputs the expression as a string
	 * @returns {String}
	 */
	BinaryExpression.prototype.toString = function() {
		return '(' + this._a.toString() + ' ' + this._operator + ' ' + this._b.toString() + ')';
	};

	/**
	 * Returns the configuration of this expression
	 * @returns {Array}
	 */
	BinaryExpression.prototype.getConfig = function() {

		return [this._a.getConfig(),this._b.getConfig()];

	};
	
	var ExpressionFormatter = {

		/**
		 * Returns the amount of sub expressions contained in the supplied expression
		 * @memberof ExpressionFormatter
		 * @param {String} expression
		 * @returns {Number}
		 * @public
		 */
		getExpressionsCount:function(expression) {
			return expression.match(/(:\{)/g).length;
		},

		/**
		 * Parses an expression in string format and returns the same expression formatted as an expression tree
		 * @memberof ExpressionFormatter
		 * @param {String} expression
		 * @returns {Array}
		 * @public
		 */
		fromString:function(expression) {

			var i=0,
				path = '',
				tree = [],
				value = '',
				negate = false,
				isValue = false,
				target = null,
				parent = null,
				parents = [],
				l=expression.length,
				lastIndex,
				index,
				operator,
				j,
				c,
				k,
				n,
				op,
				ol,
				tl;

			if (!target) {
				target = tree;
			}

			// read explicit expressions
			for (;i<l;i++) {

				c = expression.charCodeAt(i);

				// check if an expression, test for '{'
				if (c === 123) {

					// now reading the expression
					isValue = true;

					// reset path var
					path = '';

					// fetch path
					k = i-2;
					while(k>=0) {
						n = expression.charCodeAt(k);

	                    // test for ' ' or '('
						if (n === 32 || n === 40) {
							break;
						}
						path = expression.charAt(k) + path;
						k--;
					}

					// on to the next character
					continue;

				}
				else if (c === 125) { // '}'

					lastIndex = target.length-1;
					index = lastIndex+1;

					// negate if last index contains not operator
					negate = target[lastIndex] === 'not';

					// if negate overwrite not operator location in array
					index = negate ? lastIndex : lastIndex+1;

					// add expression
					target[index] = new UnaryExpression({'path':path,'value':value},negate);

					// reset vars
					path = '';
					value = '';

					negate = false;

					// no longer a value
					isValue = false;
				}

				// if we are reading an expression add characters to expression
				if (isValue) {
					value += expression.charAt(i);
					continue;
				}

				// if not in expression
				// check if goes up a level, test for '('
				if (c === 40) {

					// create new empty array in target
					target.push([]);

					// remember current target (is parent)
					parents.push(target);

					// set new child slot as new target
					target = target[target.length-1];

				}

				// find out if next set of characters is a logical operator. Testing for ' ' or '('
				if (c === 32 || i === 0 || c === 40) {

					operator = expression.substr(i,5).match(/and |or |not /g);
					if (!operator) {
						continue;
					}

					// get reference and calculate length
					op = operator[0];
					ol = op.length-1;

					// add operator
					target.push(op.substring(0,ol));

					// skip over operator
					i+=ol;
				}

				// expression or level finished, time to clean up. Testing for ')'
				if (c === 41 || i === l-1) {

					do {

						// get parent reference
						parent = parents.pop();

						// if contains zero elements = ()
						if (target.length === 0) {

							// zero elements added revert to parent
							target = parent;

							continue;
						}

						// if more elements start the grouping process
						j=0;
						tl=target.length;

						for (;j<tl;j++) {

							if (typeof target[j] !== 'string') {
								continue;
							}

							// handle not expressions first
							if (target[j] === 'not') {
								target.splice(j,2,new UnaryExpression(target[j+1],true));

								// rewind
								j = -1;
								tl = target.length;
							}
							// handle binary expression
							else if (target[j+1] !== 'not') {
								target.splice(j-1,3,new BinaryExpression(target[j-1],target[j],target[j+1]));

								// rewind
								j = -1;
								tl = target.length;
							}

						}

						// if contains only one element
						if (target.length === 1 && parent) {

							// overwrite target index with target content
							parent[parent.length-1] = target[0];

							// set target to parent array
							target = parent;

						}


					}
					while(i === l-1 && parent);

				}
				// end of ')' character or last index

			}

			// return final expression tree
			return tree.length === 1 ? tree[0] : tree;

		}

	};
	var TestFactory = {

		_tests:{},

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

		_findTest:function(path) {
			return this._tests[path];
		},

		_storeTest:function(path,Test) {
			this._tests[path] = Test;
		},

		getTest:function(path,found) {

			path = 'conditioner/tests/' + path;

			require([path],function(config){

				var Test = TestFactory._findTest(path);
				if (!Test) {

					// create the test
					Test = TestFactory._createTest(path,config);

					// remember this test
					TestFactory._storeTest(path,Test);
				}

				found(new Test());

			});
		}
	};
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
	var ModuleRegistry = {

	    _options:{},
	    _redirects:{},

		/**
		 * Register a module
		 * @param {String} path - path to module
		 * @param {Object} options - configuration to setup for module
		 * @param {String} alias - alias name for module
		 * @static
		 */
		registerModule:function(path,options,alias) {

	        var uri = requirejs.toUrl(path);
	        this._options[uri] = options;

	        if (alias) {
	            this._redirects[alias] = path;
	        }

	        var config = {};
	        config[path] = options;
	        requirejs.config({
	            config:config
	        });

		},

	    /**
	     * Returns the actual path if the path turns out to be a redirect
	     * @param path
	     * @returns {*}
	     */
	    getRedirect:function(path) {
	        return this._redirects[path] || path;
	    },

		/**
		 * Get a registered module by path
		 * @param {String} path - path to module
		 * @return {Object} - module specification object
		 * @static
		 */
		getModule:function(path) {

			// if no id supplied throw error
			if (!path) {
				throw new Error('ModuleRegistry.getModule(path): "path" is a required parameter.');
			}

	        return this._options[path] || this._options[requirejs.toUrl(path)];

		}

	};
	/**
	 * @exports ConditionsManager
	 * @class
	 * @constructor
	 * @param {String} conditions - conditions to be met
	 * @param {Element} [element] - optional element to measure these conditions on
	 */
	var ConditionsManager = function(conditions,element) {

		// if the conditions are suitable, by default they are
		this._suitable = true;

		// if no conditions, conditions will always be suitable
		if (typeof conditions !== 'string') {
			return;
		}

		// conditions supplied, conditions are now unsuitable by default
		this._suitable = false;

		// set element reference
		this._element = element;

		// change event bind
		this._onResultsChangedBind = this._onTestResultsChanged.bind(this);

		// returns the amount of expressions in this expression
		this._count = ExpressionFormatter.getExpressionsCount(conditions);

		// load to expression tree
		this._expression = ExpressionFormatter.fromString(conditions);

		// load tests to expression tree
		this._loadExpressionTests(this._expression.getConfig());
	};

	ConditionsManager.prototype = {

		/**
		 * Returns true if the current conditions are suitable
		 * @return {Boolean}
		 * @public
		 */
		getSuitability:function() {
			return this._suitable;
		},

		/**
		 * Tests if conditions are suitable
		 * @fires change
		 * @public
		 */
		test:function() {

			// test expression success state
			var suitable = this._expression.succeeds();

			// fire changed event if environment suitability changed
			if (suitable != this._suitable) {
				this._suitable = suitable;
				Observer.publish(this,'change');
			}
		},

		/**
		 * Loads test configurations contained in expressions
		 * @param {Array} configuration
		 * @private
		 */
		_loadExpressionTests:function(configuration) {

			var i=0,l=configuration.length;

			for (;i<l;i++) {

				if (Array.isArray(configuration[i])) {
					this._loadExpressionTests(configuration[i]);
					continue;
				}

				this._loadTesterToExpression(configuration[i].config,configuration[i].expression);
			}
		},

		/**
		 * Loads a tester to supplied expression
		 * @param {Object} config
		 * @param {UnaryExpression} expression
		 * @private
		 */
		_loadTesterToExpression:function(config,expression) {

			var self = this;

			TestFactory.getTest(config.path,function(test) {

				// assign tester to expression
				expression.assignTester(
					new Tester(test,config.value,self._element)
				);

				// listen to test result updates
				Observer.subscribe(test,'change',self._onResultsChangedBind);

				// lower test count
				self._count--;
				if (self._count===0) {
					self._onReady();
				}

			});
		},

		 /**
		 * Called when all tests are ready
		 * @fires ready
		 * @private
		 */
		_onReady:function() {

			// test current state
			this.test();

			// we are now ready to start testing
			Observer.publish(this,'ready',this._suitable);
		},

		/**
		 * Called when a condition has changed
		 * @private
		 */
		_onTestResultsChanged:function() {
			this.test();
		}

	};
	/**
	 * @exports ModuleController
	 * @class
	 * @constructor
	 * @param {String} path - reference to module
	 * @param {Element} element - reference to element
	 * @param {Object} [options] - options for this ModuleController
	 */
	var ModuleController = function(path,element,options) {

		// if no path supplied, throw error
		if (!path || !element) {
			throw new Error('ModuleController(path,element,options): "path" and "element" are required parameters.');
		}

		// path to module
		this._path = ModuleRegistry.getRedirect(path);
	    this._alias = path;

		// reference to element
		this._element = element;

		// options for module controller
		this._options = options || {};

		// module reference
		this._Module = null;

		// module instance reference
		this._module = null;

		// check if conditions specified
		this._conditionsManager = new ConditionsManager(
			this._options.conditions,
			this._element
		);

		// listen to ready event on condition manager
		Observer.subscribe(this._conditionsManager,'ready',this._onInitialized.bind(this));

		// by default the module controller has not yet initialized and is not available
		// unless the contained module is not conditioned or conditions are already suitable
		this._initialized = !this.isModuleConditioned() || this._conditionsManager.getSuitability();

		// not available at this moment
		this._available = false;
	};

	ModuleController.prototype = {

		/**
		 * Returns true if the module is available for initialisation, this is true when conditions have been met.
		 * This does not mean the module is active, it means the module is ready and suitable for activation.
		 * @return {Boolean}
		 * @public
		 */
		isModuleAvailable:function() {
			this._available = this._conditionsManager.getSuitability();
			return this._available;
		},

		/**
		 * Returns true if module is currently active and loaded
		 * @returns {Boolean}
		 * @public
		 */
		isModuleActive:function() {
			return this._module !== null;
		},

		/**
		 * Returns true if the module requires certain conditions to be met
		 * @return {Boolean}
		 * @public
		 */
		isModuleConditioned:function() {
			return typeof this._options.conditions !== 'undefined';
		},

		/**
		 * Returns true if the module controller has finished the initialization process,
		 * this is true when conditions have been read for the first time (and have been deemed suitable)
		 * or no conditions have been set
		 * @return {Boolean}
		 * @public
		 */
		hasInitialized:function() {
			return this._initialized;
		},

		/**
		 * Checks if the module matches the supplied path
		 * @param {String} path - path of module to test for
		 * @return {Boolean}
		 * @public
		 */
		matchesPath:function(path) {
			return this._path === path || this._alias === path;
		},

		/**
		 * @private
		 * @param {Boolean} suitable
		 * @fires ready
		 */
		_onInitialized:function(suitable) {

			// module has now completed the initialization process (this does not mean it's available)
			this._initialized = true;

			// listen to changes in conditions
			Observer.subscribe(this._conditionsManager,'change',this._onConditionsChange.bind(this));

			// let others know we have initialized
			Observer.publish(this,'init',this);

			// are we available
			if (suitable) {
				this._onBecameAvailable();
			}

		},

		/**
		 * @private
		 * @fires available
		 */
		_onBecameAvailable:function() {

			// module is now available
			this._available = true;

			// let other know we are available
			Observer.publish(this,'available',this);

		},

		/**
		 * Called when the conditions change
		 * @private
		 */
		_onConditionsChange:function() {

			var suitable = this._conditionsManager.getSuitability();

			if (this._module && !suitable) {
				this.unload();
			}

			if (!this._module && suitable) {
				this._onBecameAvailable();
			}

		},

		/**
		 * Load the module contained in this ModuleController
		 * @public
		 */
		load:function() {

			// if module available no need to require it
			if (this._Module) {
				this._onLoad();
				return;
			}

			// load module, and remember reference
			var self = this;
			require([this._path],function(Module) {

				// set reference to Module
				self._Module = Module;

				// module is now ready to be loaded
				self._onLoad();

			});

		},

	    _parseOptionOverrides:function(options) {
	        if (typeof options === 'string') {
	            try {
	                return JSON.parse(options);
	            }
	            catch(e) {
	                throw new Error('ModuleController.load(): "options" is not a valid JSON string.');
	            }
	        }
	        return options;
	    },

	    _parseOptions:function(url,Module,overrides) {

	        var stack = [],options,i,pageOptions = {},moduleOptions = {};

	        do {

	            // get settings
	            options = ModuleRegistry.getModule(url);

	            // stack the options
	            stack.push({
	                'page':options,
	                'module':Module.options
	            });

	            // fetch super path
	            url = Module.__superUrl;

	        } while (Module = Module.__super);

	        // reverse loop over stack and merge options
	        i = stack.length;
	        while (i--) {
	            pageOptions = mergeObjects(pageOptions,stack[i].page);
	            moduleOptions = mergeObjects(moduleOptions,stack[i].module);
	        }

	        // merge page and module options
	        options = mergeObjects(moduleOptions,pageOptions);

	        // apply overrides
	        if (overrides) {
	            options = mergeObjects(options,this._parseOptionOverrides(overrides));
	        }

	        return options;
	    },

		/**
		 * Method called when module loaded
		 * @fires load
		 * @private
		 */
		_onLoad:function() {

			// if no longer available for loading stop here
			if (!this.isModuleAvailable()) {
				return;
			}

	        // parse and merge options for this module
	        var options = this._parseOptions(this._path,this._Module,this._options.options);

			// set reference
			if (typeof this._Module === 'function') {

				// is of function type so try to create instance
				this._module = new this._Module(this._element,options);
			}
			else {

				// is of other type so expect load method to be defined
				this._module = this._Module.load ? this._Module.load(this._element,options) : null;

				// if module not defined we are probably dealing with a static class
				if (typeof this._module === 'undefined') {
					this._module = this._Module;
				}
			}

			// if no module defined throw error
			if (!this._module) {
				throw new Error('ModuleController.load(): could not initialize module, missing constructor or "load" method.');
			}

			// set initialized attribute to initialized module
			this._element.setAttribute('data-initialized',this._path);

			// watch for events on target
			// this way it is possible to listen to events on the controller which is always there
			Observer.inform(this._module,this);

			// publish load event
			Observer.publish(this,'load',this);

		},

		/**
		 * Unloads the wrapped module
		 * @fires unload
		 * @return {Boolean}
		 * @public
		 */
		unload:function() {

			// module is now no longer ready to be loaded
			this._available = false;

			// if no module, module has already been unloaded or was never loaded
			if (!this._module) {
				return false;
			}

			// stop watching target
			Observer.conceal(this._module,this);

			// unload module if possible
			if (this._module.unload) {
				this._module.unload();
			}

			// remove initialized attribute
			this._element.removeAttribute('data-initialized');

			// reset property
			this._module = null;

			// publish unload event
			Observer.publish(this,'unload',this);

			return true;
		},

		/**
		 * Executes a methods on the wrapped module
		 * @param {String} method - method key
		 * @param {Array} [params] - optional array containing the method parameters
		 * @return {Object} containing response of executed method and a status code
		 * @public
		 */
		execute:function(method,params) {

			// if module not loaded
			if (!this._module) {
				return {
					'status':404,
					'response':null
				};
			}

			// get function reference
			var F = this._module[method];
			if (!F) {
				throw new Error('ModuleController.execute(method,params): function specified in "method" not found on module.');
			}

			// if no params supplied set to empty array,
			// ie8 falls on it's knees when it gets an undefined parameter object in the apply method
			params = params || [];

			// once loaded call method and pass parameters
			return {
				'status':200,
				'response':F.apply(this._module,params)
			};

		}

	};
	/**
	 * @exports NodeController
	 * @class
	 * @constructor
	 * @param {Object} element
	 */
	var NodeController = function(element) {

		if (!element) {
			throw new Error('NodeController(element): "element" is a required parameter.');
		}

		// set element reference
		this._element = element;

		// has been processed
		this._element.setAttribute('data-processed','true');

		// set priority
		var prio = this._element.getAttribute('data-priority');
		this._priority = !prio ? 0 : parseInt(prio,10);

		// contains references to all module controllers
		this._moduleControllers = [];

		// contains reference to currently active module controller
		this._activeModuleController = null;

		// method to unbind
		this._activeModuleUnloadBind = this._onActiveModuleUnload.bind(this);

	};

	/**
	 * Static method testing if the current element has been processed already
	 * @param {Element} element
	 * @static
	 */
	NodeController.hasProcessed = function(element) {
		return element.getAttribute('data-processed') === 'true';
	};

	NodeController.prototype = {

		/**
		 * Loads the passed module controllers to the node
	     * @param {Array} controllers
		 * @public
		 */
		load:function(controllers) {

	        // if no module controllers found
	        if (!controllers || !controllers.length) {
	            throw new Error('NodeController.load(controllers): Expects an array of module controllers as parameters.');
	        }

			// parse element module attributes
	        this._moduleControllers = controllers;

			// initialize
			var i=0,l=this._moduleControllers.length,mc;

			// listen to init events on module controllers
			for (;i<l;i++) {

				mc = this._moduleControllers[i];

				// if module already has initialized, jump to _onModuleInitialized method and don't bind listener
				if (mc.hasInitialized()) {
					this._onModuleInitialized();
					continue;
				}

				// otherwise, listen to init event
				Observer.subscribe(mc,'init',this._onModuleInitialized.bind(this));
			}
		},

		/**
		 * Returns the set priority for this node
		 * @public
		 */
		getPriority:function() {
			return this._priority;
		},

		/**
		 * Returns the element linked to this node
		 * @public
		 */
		getElement:function() {
			return this._element;
		},

		/**
		 * Public method to check if the module matches the given query
		 * @param {String} selector - CSS selector to match module to
		 * @param {Document|Element} [context] - Context to search in
		 * @return {Boolean}
		 * @public
		 */
		matchesSelector:function(selector,context) {

			if (context && !contains(context,this._element)) {
				return false;
			}

			return matchesSelector(this._element,selector,context);
		},

		/**
		 * Returns true if any of the nodes modules are active
		 * @public
		 */
		hasLoadedModule:function() {
			return this._activeModuleController ? this._activeModuleController.isModuleActive() : false;
		},

		/**
		 * Returns a reference to the currently active module controller
		 * @return {ModuleController|null}
		 * @public
		 */
		getActiveModuleController:function() {
			return this._activeModuleController;
		},

		/**
		 * Returns the first ModuleController matching the given path
		 * @param {String} [path] to module
		 * @return {ModuleController|null}
		 * @public
		 */
		getModuleController:function(path) {
			return this._getModuleControllers(path,true);
		},

		/**
		 * Returns an array of ModuleControllers matching the given path
		 * @param {String} [path] to module
		 * @return {Array}
		 * @public
		 */
		getModuleControllers:function(path) {
			return this._getModuleControllers(path);
		},

		/**
		 * Returns one or multiple ModuleControllers matching the supplied path
		 * @param {String} [path] - Optional path to match the nodes to
		 * @param {Boolean} [singleResult] - Optional boolean to only ask one result
		 * @returns {Array|ModuleController|null}
		 * @private
		 */
		_getModuleControllers:function(path,singleResult) {

			if (typeof path === 'undefined') {
				if (singleResult) {
					return this._moduleControllers[0];
				}
				return this._moduleControllers.concat();
			}

			var i=0,l=this._moduleControllers.length,results=[],mc;
			for (;i<l;i++) {
				mc = this._moduleControllers[i];
				if (mc.matchesPath(path)) {
					if (singleResult) {
						return mc;
					}
					results.push(mc);
				}
			}
			return singleResult ? null : results;
		},

		/**
		 * Public method for safely executing methods on the loaded module
		 * @param {String} method - method key
		 * @param {Array} [params] - array containing the method parameters
		 * @return {Object} returns object containing status code and possible response data
		 * @public
		 */
		execute:function(method,params) {

			// if active module controller defined
			if (this._activeModuleController) {
				return this._activeModuleController.execute(method,params);
			}

			// no active module
			return {
				'status':404,
				'response':null
			};
		},

		/**
		 * Called when a module has indicated it's initialization is done
		 * @private
		 */
		_onModuleInitialized:function() {

			var i=this._moduleControllers.length;

			// check if all modules have initialized, if so move on to the next init stage
			while (--i >= 0) {
				if (!this._moduleControllers[i].hasInitialized()) {
					return;
				}
			}

			this._onModulesInitialized();
		},

		/**
		 * Called when all modules have been initialized
		 * @private
		 */
		_onModulesInitialized:function() {

			// find suitable active module controller
			var ModuleController = this._getSuitableActiveModuleController();
			if (ModuleController) {
				this._setActiveModuleController(ModuleController);
			}

			// listen to available events on controllers
			var i=0,l=this._moduleControllers.length;
			for (;i<l;i++) {
				Observer.subscribe(this._moduleControllers[i],'available',this._onModuleAvailable.bind(this));
			}

		},

		/**
		 * Called when a module controller has indicated it is ready to be loaded
		 * @param {ModuleController} ModuleController
		 * @private
		 */
		_onModuleAvailable:function(ModuleController) {

			// setup vars
			var i=0,l=this._moduleControllers.length,mc;

			for (;i<l;i++) {

				mc = this._moduleControllers[i];

				if (mc !== ModuleController &&
					mc.isModuleAvailable() &&
					mc.isModuleConditioned()) {

					// earlier or conditioned module is ready, therefor cannot load this module

					return;
				}
			}

			// load supplied module controller as active module
			this._setActiveModuleController(ModuleController);

		},

		/**
		 * Sets the active module controller
		 * @param {ModuleController} ModuleController
		 * @private
		 */
		_setActiveModuleController:function(ModuleController) {

			// if not already loaded
			if (ModuleController === this._activeModuleController) {
				return;
			}

			// clean up active module controller reference
			this._cleanActiveModuleController();

			// set new active module controller
			this._activeModuleController = ModuleController;

			// listen to unload event so we can load another module if necessary
			Observer.subscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);

			// propagate events from the module controller to the node so people can subscribe to events on the node
			Observer.inform(this._activeModuleController,this);

			// finally load the module controller
			this._activeModuleController.load();

		},

		/**
		 * Removes the active module controller
		 * @private
		 */
		_cleanActiveModuleController:function() {

			// if no module controller defined do nothing
			if (!this._activeModuleController) {
				return;
			}

			// stop listening to unload
			Observer.unsubscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);

			// conceal events from active module controller
			Observer.conceal(this._activeModuleController,this);

			// unload controller
			this._activeModuleController.unload();

			// remove reference
			this._activeModuleController = null;
		},

		/**
		 * Called when active module unloaded
		 * @private
		 */
		_onActiveModuleUnload:function() {

			// clean up active module controller reference
			this._cleanActiveModuleController();

			// active module was unloaded, find another active module
			var ModuleController = this._getSuitableActiveModuleController();
			if(!ModuleController) {
				return;
			}

			// set found module controller as new active module controller
			this._setActiveModuleController(ModuleController);
		},

		/**
		 * Returns a suitable module controller
		 * @returns {null|ModuleController}
		 * @private
		 */
		_getSuitableActiveModuleController:function() {

			// test if other module is ready, if so load first module to be fitting
			var i=0,l=this._moduleControllers.length,mc;
			for (;i<l;i++) {

				mc = this._moduleControllers[i];

				// if not ready, skip to next controller
				if (!mc.isModuleAvailable()) {
					continue;
				}

				return mc;
			}

			return null;
		}
	};
	/**
	 *
	 * @constructor
	 */
	var SyncedControllerGroup = function() {

	    this._hasLoaded = false;

	    this._count = arguments.length;
	    this._controllers = [];
	    this._controllerLoadedBind = this._onLoad.bind(this);
	    this._controllerUnloadedBind = this._onUnload.bind(this);

	    var i=0,controller;
	    for (;i<this._count;i++) {
	        controller = arguments[i];

	        // skip if method has loaded module not defined
	        if (!controller.hasLoadedModule) {continue;}

	        // listen to load and unload events so we can pass them on if appropriate
	        Observer.subscribe(controller,'load',this._controllerLoadedBind);
	        Observer.subscribe(controller,'unload',this._controllerUnloadedBind);

	        // we need to collect all controllers so we can measure if they've all loaded
	        this._controllers.push(controller);
	    }

	    this._test();
	};

	SyncedControllerGroup.prototype = {

	    _onLoad:function() {
	        this._test();
	    },

	    _onUnload:function() {
	        this._unload();
	    },

	    _test:function() {

	        // loop over modules testing their active state
	        var i=0;
	        for (;i<this._count;i++) {
	            if (!this._controllers[i].hasLoadedModule()) {
	                return;
	            }
	        }

	        // if all active fire load event
	        this._load();
	    },

	    _load:function() {
	        if (!this._hasLoaded) {
	            this._hasLoaded = true;
	            Observer.publishAsync(this,'load',this._controllers);
	        }
	    },

	    _unload:function() {
	        if (this._hasLoaded) {
	            this._hasLoaded = false;
	            Observer.publish(this,'unload',this._controllers);
	        }
	    }

	};
	/**
	 * @exports ModuleLoader
	 * @class
	 * @constructor
	 */
	var ModuleLoader = function() {

		// options for ModuleLoader
		this._options = {
			'modules':{}
		};

		// array of all parsed nodes
		this._nodes = [];
	};

	ModuleLoader.prototype = {

	    /**
	     * Initialises the conditioner and parses the document for modules
	     * @param {Object} [options] - optional options to override
	     * @public
	     */
	    init:function(options) {

	        if (options) {
	            this.setOptions(options);
	        }

	        this.parse(document);

	    },

		/**
		 * Set custom options
		 * @param {Object} options - options to override
		 * @public
		 */
		setOptions:function(options) {

			if (!options) {
				throw new Error('ModuleLoader.setOptions(options): "options" is a required parameter.');
			}

			// update options
			this._options = mergeObjects(this._options,options);

			// loop over modules
			var config,path,mod,alias;
			for (path in this._options.modules) {

				if (!this._options.modules.hasOwnProperty(path)){continue;}

				// get module reference
				mod = this._options.modules[path];

				// get alias
				alias = typeof mod === 'string' ? mod : mod.alias;

				// get config
				config = typeof mod === 'string' ? null : mod.options || {};

				// register this module
				ModuleRegistry.registerModule(path,config,alias);

			}
		},


		/**
		 * Loads all modules within the supplied dom tree
		 * @param {Document|Element} context - Context to find modules in
		 * @return {Array} - Array of found Nodes
		 */
		parse:function(context) {

			// if no context supplied, throw error
			if (!context) {
				throw new Error('ModuleLoader.loadModules(context): "context" is a required parameter.');
			}

			// register vars and get elements
			var elements = context.querySelectorAll('[data-module]'),
				l = elements.length,
				i = 0,
				nodes = [],
				element;

			// if no elements do nothing
			if (!elements) {
				return [];
			}

			// process elements
			for (; i<l; i++) {

				// set element reference
				element = elements[i];

				// test if already processed
				if (NodeController.hasProcessed(element)) {
					continue;
				}

				// create new node
				nodes.push(new NodeController(element));
			}

			// sort nodes by priority:
			// higher numbers go first,
			// then 0 (a.k.a. no priority assigned),
			// then negative numbers
			// note: it's actually the other way around but that's because of the reversed while loop coming next
			nodes.sort(function(a,b){
				return a.getPriority() - b.getPriority();
			});

			// initialize modules depending on assigned priority (in reverse, but priority is reversed as well so all is okay)
			i = nodes.length;
			while (--i >= 0) {
				nodes[i].load(this._getModuleControllersByElement(nodes[i].getElement()));
			}

			// merge new nodes with currently active nodes list
			this._nodes = this._nodes.concat(nodes);

			// returns nodes so it is possible to later unload nodes manually if necessary
			return nodes;
		},

	    /**
	     * Setup the given element with the passed module controller(s)
	     * @param {Element} element - Element to bind the controllers to
	     * @param {Array|ModuleController} controllers - module controller configurations
	     * [
	     *     {
	     *         path: 'path/to/module',
	     *         conditions: 'config',
	     *         options: {
	     *             foo: 'bar'
	     *         }
	     *     }
	     * ]
	     * @return {NodeController|null} - The newly created node or null if something went wrong
	     */
	    load:function(element,controllers) {

	        if (!controllers) {return null;}

	        // if controllers is object put in array
	        controllers = controllers.length ? controllers : [controllers];

	        // vars
	        var node,i=0,l=controllers.length,moduleControllers=[],controller;

	        // create node
	        node = new NodeController(element);

	        // create controllers
	        for (;i<l;i++) {
	            controller = controllers[i];
	            moduleControllers.push(
	                new ModuleController(controller.path,element,{
	                    'conditions':controller.conditions,
	                    'options':controller.options
	                })
	            );
	        }

	        // create initialize
	        node.load(moduleControllers);

	        // remember so can later be retrieved through getNode methodes
	        this._nodes.push(node);

	        // return the loaded Node
	        return node;
	    },

	    /**
	     * Returns a synced controller group which fires a load event once all modules have loaded
	     * {ModuleController|NodeController} [arguments] - list of module controllers or node controllers to synchronize
	     * @return SyncedControllerGroup.prototype
	     */
	    sync:function() {

	        var group = Object.create(SyncedControllerGroup.prototype);

	        // test if user passed an array instead of separate arguments
	        if (arguments.length == 1 && !arguments.slice) {
	            arguments = arguments[0];
	        }

	        // create synced controller group using passed arguments
	        SyncedControllerGroup.apply(group, arguments);

	        return group;
	    },

	    /**
		 * Returns the first Node matching the selector
		 * @param {String} [selector] - Selector to match the nodes to
		 * @param {Document|Element} [context] - Context to search in
		 * @return {Node|null} First matched node or null
		 */
		getNode:function(selector,context) {
			return this._getNodes(selector,context,true);
		},

		/**
		 * Returns all nodes matching the selector
		 * @param {String} [selector] - Optional selector to match the nodes to
		 * @param {Document|Element} [context] - Context to search in
		 * @return {Array} Array containing matched nodes or empty Array
		 */
		getNodes:function(selector,context) {
			return this._getNodes(selector,context);
		},

		/**
		 * Returns one or multiple nodes matching the selector
		 * @param {String} [selector] - Optional selector to match the nodes to
		 * @param {Document|Element} [context] - Context to search in
		 * @param {Boolean} [singleResult] - Optional boolean to only ask one result
		 * @returns {Array|Node|null}
		 * @private
		 */
		_getNodes:function(selector,context,singleResult) {

			// if no query supplied return all nodes
			if (typeof selector === 'undefined' && typeof context === 'undefined') {
				if (singleResult) {
					return this._nodes[0];
				}
				return this._nodes.concat();
			}

			// find matches (done by querying the node for a match)
			var i=0,l=this._nodes.length,results=[],node;
			for (;i<l;i++) {
				node = this._nodes[i];
				if (node.matchesSelector(selector,context)) {
					if (singleResult) {
						return node;
					}
					results.push(node);
				}
			}

			return singleResult ? null : results;
		},

	    /**
	     * Parses module controller configuration on element and returns array of module controllers
	     * @param {Element} element
	     * @returns {Array}
	     * @private
	     */
	    _getModuleControllersByElement:function(element) {

	        var controllers = [],
	            config = element.getAttribute('data-module') || '',

	        // test if first character is a '[', if so multiple modules have been defined
	        multiple = config.charCodeAt(0) === 91;

	        if (multiple) {

	            var specs;

	            // add multiple module adapters
	            try {
	                specs = JSON.parse(config);
	            }
	            catch(e) {
	                // failed parsing spec
	                throw new Error('ModuleLoader.load(context): "data-module" attribute contains a malformed JSON string.');
	            }

	            // no specification found or specification parsing failed
	            if (!specs) {
	                return [];
	            }

	            // setup vars
	            var l=specs.length,i=0,spec;

	            // create specs
	            for (;i<l;i++) {

	                spec = specs[i];

	                controllers.push(
	                    new ModuleController(spec.path,element,{
	                        'conditions':spec.conditions,
	                        'options':spec.options
	                    })
	                );
	            }
	        }
	        else if (config.length) {

	            controllers.push(
	                new ModuleController(config,element,{
	                    'conditions':element.getAttribute('data-conditions'),
	                    'options':element.getAttribute('data-options')
	                })
	            );

	        }

	        return controllers;
	    }

	};

	return new ModuleLoader();

});
define('conditioner/extendClass',[],function(){

    /**
     * JavaScript Inheritance
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_Revisited
     */

    return function() {

        // get child constructor
        var Child = arguments[arguments.length-1],
            first = arguments[0],req,path;

        if (typeof first === 'string') {
            req = requirejs;
            path = first;
            Child.__superUrl = first;
        }
        else {
            req = first;
            path = arguments[1];
            Child.__superUrl = req.toUrl(path);
        }

        // set super object reference
        Child.__super = req(path);

        // require actual super module (should already have loaded before calling extend) and copy prototype to child
        Child.prototype = Object.create(Child.__super.prototype);

        // return the Child Class
        return Child;

    };

});