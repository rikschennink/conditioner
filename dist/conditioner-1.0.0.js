// conditioner v1.0.0 - ConditionerJS - Frizz free, environment-aware, javascript modules.
// Copyright (c) 2014 Rik Schennink - http://conditionerjs.com
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
define(['require','./utils/Observer','./utils/contains','./utils/matchesSelector','./utils/mergeObjects'],function(require,Observer,contains,matchesSelector,mergeObjects) {

	'use strict';

	/**
	 * @module conditioner
	 */
	/**
	 * @class
	 * @constructor
	 * @param {BinaryExpression|Tester|object} expression
	 * @param {Boolean} negate
	 */
	var UnaryExpression = function(expression,negate) {

		this._expression = expression instanceof BinaryExpression || expression instanceof UnaryExpression ? expression : null;

		this._config = this._expression ? null : expression;

		this._negate = typeof negate === 'undefined' ? false : negate;

	};

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
	 * @param {UnaryExpression} a
	 * @param {String} operator
	 * @param {UnaryExpression} b
	 */
	var BinaryExpression = function(a,operator,b) {

		this._a = a;
		this._operator = operator;
		this._b = b;

	};

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

	            // else if is '}'
				else if (c === 125) {

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

			require([path],function(config){

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

	        var uri = requirejs.toUrl(path),config;
	        this._options[uri] = options;

	        if (alias) {
	            this._redirects[alias] = path;
	        }

	        config = {};
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
	 * @exports ModuleController
	 * @class
	 * @constructor
	 * @param {String} path - reference to module
	 * @param {Element} element - reference to element
	 * @param {Object|null} [options] - options for this ModuleController
	 * @param {Object} [agent] - module activation agent
	 */
	var ModuleController = function(path,element,options,agent) {

		// if no path supplied, throw error
		if (!path || !element) {
			throw new Error('ModuleController(path,element,options,agent): "path" and "element" are required parameters.');
		}

		// path to module
		this._path = ModuleRegistry.getRedirect(path);
	    this._alias = path;

		// reference to element
		this._element = element;

		// options for module controller
		this._options = options || {};

	    // set loader
	    this._agent = agent || StaticModuleAgent;

	    // module definition reference
	    this._Module = null;

	    // module instance reference
	    this._module = null;

	    // default init state
	    this._initialized = false;

	    // agent binds
	    this._onAgentReadyBind = this._onAgentReady.bind(this);
	    this._onAgentStateChangeBind = this._onAgentStateChange.bind(this);

	    // let's see if the behavior allows immediate activation
	    if (this._agent.allowsActivation()) {
	        this._initialize();
	    }
	    // wait for ready state on behavior
	    else {
	        Observer.subscribe(this._agent,'ready',this._onAgentReadyBind);
	    }

	};

	ModuleController.prototype = {

	    /**
	     * returns true if the module controller has initialized
	     * @returns {Boolean}
	     */
	    hasInitialized:function() {
	        return this._initialized;
	    },

	    /**
	     * Returns the module path
	     * @returns {String}
	     * @public
	     */
	    getModulePath:function() {
	        return this._path;
	    },

	    /**
	     * Returns true if the module is currently waiting for load
	     * @returns {Boolean}
	     * @public
	     */
	    isModuleAvailable:function() {
	        return this._agent.allowsActivation();
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
	     * Checks if it wraps a module with the supplied path
	     * @param {String} path - path of module to test for
	     * @return {Boolean}
	     * @public
	     */
	    wrapsModuleWithPath:function(path) {
	        return this._path === path || this._alias === path;
	    },

		/**
	     * Called when the module behavior has initialized
		 * @private
		 */
		_onAgentReady:function() {

			// module has now completed the initialization process
			// (!) this does not mean it's available
	        this._initialize();

		},

	    /**
	     * Called to initialize the module
	     * @private
	     * @fires init
	     */
	    _initialize:function() {

	        // now in initialized state
	        this._initialized = true;

	        // listen to behavior changes
	        Observer.subscribe(this._agent,'change',this._onAgentStateChangeBind);

	        // let others know we have initialized
	        Observer.publishAsync(this,'init',this);

	        // if activation is allowed, we are directly available
	        if (this._agent.allowsActivation()) {
	            this._onBecameAvailable();
	        }

	    },

		/**
	     * Called when the module became available, this is when it's suitable for load
		 * @private
		 * @fires available
		 */
		_onBecameAvailable:function() {

	        // we are now available
	        Observer.publishAsync(this,'available',this);

			// let's load the module
	        this._load();

		},

		/**
		 * Called when the agent state changes
		 * @private
		 */
	    _onAgentStateChange:function() {

	        // check if module is available
	        var shouldLoadModule = this._agent.allowsActivation();

	        // determine what action to take basted on availability of module
			if (this._module && !shouldLoadModule) {
				this._unload();
			}
			else if (!this._module && shouldLoadModule) {
				this._onBecameAvailable();
			}

		},

		/**
		 * Load the module contained in this ModuleController
		 * @public
		 */
		_load:function() {

			// if module available no need to require it
			if (this._Module) {
				this._onLoad();
				return;
			}

			// load module, and remember reference
			var self = this;

	        // use 'requirejs' instead of 'require' as 'require' would be relative to conditioner in this context
			requirejs([this._path],function(Module) {

	            // if module does not export a module quit here
	            if (!Module) {
	                throw new Error('ModuleController: A module needs to export an object.');
	            }

				// set reference to Module
				self._Module = Module;

				// module is now ready to be loaded
				self._onLoad();

			});

		},

	    /**
	     * Turns possible options string into options object
	     * @param {String|Object} options
	     * @returns {Object}
	     * @private
	     */
	    _optionsToObject:function(options) {
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

	    /**
	     * Parses options for given url and module also
	     * @param {String} url - url to module
	     * @param {Object} Module - Module definition
	     * @param {Object|String} overrides - page level options to override default options with
	     * @returns {Object}
	     * @private
	     */
	    _parseOptions:function(url,Module,overrides) {

	        var stack = [],pageOptions = {},moduleOptions = {},options,i;
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

	            // jshint -W084
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
	            options = mergeObjects(options,this._optionsToObject(overrides));
	        }

	        return options;
	    },

		/**
		 * Method called when module loaded
		 * @fires load
		 * @private
		 */
		_onLoad:function() {

			// if activation is no longer allowed, stop here
	        if (!this._agent.allowsActivation()) {
				return;
			}

	        // parse and merge options for this module
	        var options = this._parseOptions(this._path,this._Module,this._options);

			// set reference
			if (typeof this._Module === 'function') {

				// is of function type so try to create instance
				this._module = new this._Module(this._element,options);
			}
			else {

				// is of other type so expect load method to be defined
				this._module = this._Module.load ? this._Module.load(this._element,options) : null;

				// if module not defined we could be dealing with a static class
				if (typeof this._module === 'undefined') {
					this._module = this._Module;
				}
			}

			// if no module defined throw error
			if (!this._module) {
				throw new Error('ModuleController.load(): could not initialize module, missing constructor or "load" method.');
			}

	        // watch for events on target
	        // this way it is possible to listen to events on the controller which is always there
	        Observer.inform(this._module,this);

	        // publish load event
	        Observer.publishAsync(this,'load',this);
		},


		/**
		 * Unloads the wrapped module
		 * @fires unload
		 * @return {Boolean}
		 */
		_unload:function() {

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

	        // reset property
	        this._module = null;

	        // publish unload event
	        Observer.publishAsync(this,'unload',this);

			return true;
		},

	    /**
	     * Cleans up the module and module controller and all bound events
	     * @public
	     */
	    destroy:function() {

	        // unload module
	        this._unload();

	        // unbind events
	        Observer.unsubscribe(this._agent,'ready',this._onAgentReadyBind);
	        Observer.unsubscribe(this._agent,'change',this._onAgentStateChangeBind);

	        // call destroy on agent
	        this._agent.destroy();

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
	var NodeController = (function(){

	    var _filterIsActiveModule = function(item){return item.isModuleActive();};
	    var _filterIsAvailableModule = function(item){return item.isModuleAvailable();};
	    var _mapModuleToPath = function(item){return item.getModulePath();};

	    /**
	     * @class
	     * @constructor
	     * @param {Object} element
	     * @param {Number} priority
	     */
	    var exports = function NodeController(element,priority) {

	        if (!element) {
	            throw new Error('NodeController(element): "element" is a required parameter.');
	        }

	        // set element reference
	        this._element = element;

	        // has been processed
	        this._element.setAttribute('data-processed','true');

	        // set priority
	        this._priority = !priority ? 0 : parseInt(priority,10);

	        // contains references to all module controllers
	        this._moduleControllers = [];

	        // binds
	        this._moduleAvailableBind = this._onModuleAvailable.bind(this);
	        this._moduleLoadBind = this._onModuleLoad.bind(this);
	        this._moduleUnloadBind = this._onModuleUnload.bind(this);

	    };

	    /**
	     * Static method testing if the current element has been processed already
	     * @param {Element} element
	     * @static
	     */
	    exports.hasProcessed = function(element) {
	        return element.getAttribute('data-processed') === 'true';
	    };

	    exports.prototype = {

	        /**
	         * Loads the passed module controllers to the node
	         * @param {...} arguments
	         * @public
	         */
	        load:function() {

	            // if no module controllers found
	            if (!arguments || !arguments.length) {
	                throw new Error('NodeController.load(controllers): Expects an array of module controllers as parameters.');
	            }

	            // turn into array
	            this._moduleControllers = Array.prototype.slice.call(arguments,0);

	            // listen to load events on module controllers
	            var i=0,l=this._moduleControllers.length,mc;
	            for (;i<l;i++) {
	                mc = this._moduleControllers[i];
	                Observer.subscribe(mc,'available',this._moduleAvailableBind);
	                Observer.subscribe(mc,'load',this._moduleLoadBind);
	            }

	        },

	        /**
	         * Unload all attached modules and restore node in original state
	         * @public
	         */
	        destroy:function() {

	            var i=0,l=this._moduleControllers.length;
	            for (;i<l;i++) {
	                this._destroyModuleController(this._moduleControllers[i]);
	            }

	            // reset array
	            this._moduleControllers = [];

	            // update initialized state
	            this._updateAttribute('initialized',this._moduleControllers);

	            // reset processed state
	            this._element.removeAttribute('data-processed');

	            // reset element reference
	            this._element = null;
	        },

	        /**
	         * Call destroy method on module controller and clean up listeners
	         * @param moduleController
	         * @private
	         */
	        _destroyModuleController:function(moduleController) {

	            // unsubscribe from module events
	            Observer.unsubscribe(moduleController,'load',this._moduleLoadBind);
	            Observer.unsubscribe(moduleController,'unload',this._moduleUnloadBind);

	            // conceal events from module controller
	            Observer.conceal(moduleController,this);

	            // unload the controller
	            moduleController.destroy();

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
	         * Returns true if all module controllers are active
	         * @public
	         */
	        areModulesActive:function() {
	            return this.getActiveModuleControllers().length === this._moduleControllers.length;
	        },

	        /**
	         * Returns an array containing all active module controllers
	         * @return {Array}
	         * @public
	         */
	        getActiveModuleControllers:function() {
	            return this._moduleControllers.filter(_filterIsActiveModule);
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
	         * @param {Boolean} [singleResult] - Optional boolean to only ask for one result
	         * @returns {Array|ModuleController|null}
	         * @private
	         */
	        _getModuleControllers:function(path,singleResult) {

	            // if no path supplied return all module controllers (or one if single result mode)
	            if (typeof path === 'undefined') {
	                if (singleResult) {
	                    return this._moduleControllers[0];
	                }
	                return this._moduleControllers.concat();
	            }

	            // loop over module controllers matching the path, if single result is enabled, return on first hit, else collect
	            var i=0,l=this._moduleControllers.length,results=[],mc;
	            for (;i<l;i++) {
	                mc = this._moduleControllers[i];
	                if (!mc.matchesPath(path)) {
	                    continue;
	                }
	                if (singleResult) {
	                    return mc;
	                }
	                results.push(mc);
	            }
	            return singleResult ? null : results;
	        },

	        /**
	         * Public method for safely attempting method execution on modules
	         * @param {String} method - method key
	         * @param {Array} [params] - array containing the method parameters
	         * @return [Array] returns object containing status code and possible response data
	         * @public
	         */
	        execute:function(method,params) {
	            return this._moduleControllers.map(function(item){
	                return {
	                    controller:item,
	                    result:item.execute(method,params)
	                };
	            });
	        },

	        /**
	         * Called when a module becomes available for load
	         * @param moduleController
	         * @private
	         */
	        _onModuleAvailable:function(moduleController) {

	            // propagate events from the module controller to the node so people can subscribe to events on the node
	            Observer.inform(moduleController,this);

	            // update loading attribute with currently loading module controllers list
	            this._updateAttribute('loading',this._moduleControllers.filter(_filterIsAvailableModule));
	        },

	        /**
	         * Called when module has loaded
	         * @param moduleController
	         * @private
	         */
	        _onModuleLoad:function(moduleController) {

	            // listen to unload event
	            Observer.unsubscribe(moduleController,'load',this._moduleLoadBind);
	            Observer.subscribe(moduleController,'unload',this._moduleUnloadBind);

	            // update loading attribute with currently loading module controllers list
	            this._updateAttribute('loading',this._moduleControllers.filter(_filterIsAvailableModule));

	            // update initialized attribute with currently active module controllers list
	            this._updateAttribute('initialized',this.getActiveModuleControllers());
	        },

	        /**
	         * Called when module has unloaded
	         * @param moduleController
	         * @private
	         */
	        _onModuleUnload:function(moduleController) {

	            // stop listening to unload
	            Observer.subscribe(moduleController,'load',this._moduleLoadBind);
	            Observer.unsubscribe(moduleController,'unload',this._moduleUnloadBind);

	            // conceal events from module controller
	            Observer.conceal(moduleController,this);

	            // update initialized attribute with now active module controllers list
	            this._updateAttribute('initialized',this.getActiveModuleControllers());
	        },

	        /**
	         * Updates the given attribute with paths of the supplied controllers
	         * @private
	         */
	        _updateAttribute:function(attr,controllers) {
	            var modules = controllers.map(_mapModuleToPath);
	            if (modules.length) {
	                this._element.setAttribute('data-' + attr,modules.join(','));
	            }
	            else {
	                this._element.removeAttribute('data-' + attr);
	            }
	        }

	    };

	    return exports;

	}());
	/**
	 * Creates a controller group to sync controllers
	 * @constructor
	 */
	var SyncedControllerGroup = function() {

	    // if no node controllers passed, no go
	    if (!arguments || !arguments.length) {
	        throw new Error('SyncedControllerGroup(controllers): Expects an array of node controllers as parameters.');
	    }

	    // by default modules are expected to not be in sync
	    this._inSync = false;

	    // turn arguments into an array
	    this._controllers = Array.prototype.slice.call(arguments,0);
	    this._controllerLoadedBind = this._onLoad.bind(this);
	    this._controllerUnloadedBind = this._onUnload.bind(this);

	    var i=0,controller,l=this._controllers.length;
	    for (;i<l;i++) {
	        controller = this._controllers[i];

	        // listen to load and unload events so we can pass them on if appropriate
	        Observer.subscribe(controller,'load',this._controllerLoadedBind);
	        Observer.subscribe(controller,'unload',this._controllerUnloadedBind);
	    }

	    // test now to see if modules might already be in sync
	    this._test();
	};

	SyncedControllerGroup.prototype = {

	    /**
	     * Destroy sync group, stops listening and cleans up
	     */
	    destroy:function() {

	        // unsubscribe
	        var i=0,controller,l=this._controllers.length;
	        for (;i<l;i++) {
	            controller = this._controllers[i];

	            // listen to load and unload events so we can pass them on if appropriate
	            Observer.unsubscribe(controller,'load',this._controllerLoadedBind);
	            Observer.unsubscribe(controller,'unload',this._controllerUnloadedBind);
	        }

	        // reset array
	        this._controllers = [];

	    },

	    /**
	     * Called when a module loads
	     * @private
	     */
	    _onLoad:function() {
	        this._test();
	    },

	    /**
	     * Called when a module unloads
	     * @private
	     */
	    _onUnload:function() {
	        this._unload();
	    },

	    /**
	     * Tests if the node or module controller has loaded their modules
	     * @param controller
	     * @returns {Boolean}
	     * @private
	     */
	    _isActiveController:function(controller) {
	        return ((controller.isModuleActive && controller.isModuleActive()) ||
	                (controller.areModulesActive && controller.areModulesActive()));
	    },

	    /**
	     * Tests if all controllers have loaded, if so calls the _load method
	     * @private
	     */
	    _test:function() {

	        // loop over modules testing their active state, if one is inactive we stop immediately
	        var i=0,l=this._controllers.length,controller;
	        for (;i<l;i++) {
	            controller = this._controllers[i];
	            if (!this._isActiveController(controller)) {
	                return;
	            }
	        }

	        // if all modules loaded fire load event
	        this._load();

	    },

	    /**
	     * Fires a load event when all controllers have indicated they have loaded and we have not loaded yet
	     * @fires load
	     * @private
	     */
	    _load:function() {
	        if (this._inSync) {return;}
	        this._inSync = true;
	        Observer.publishAsync(this,'load',this._controllers);
	    },

	    /**
	     * Fires an unload event once we are in loaded state and one of the controllers unloads
	     * @fires unload
	     * @private
	     */
	    _unload:function() {
	        if (!this._inSync) {return;}
	        this._inSync = false;
	        Observer.publish(this,'unload',this._controllers);
	    }

	};
	/**
	 * Static Module Agent, will always load the module
	 * @type {Object}
	 */
	var StaticModuleAgent = {

	    /**
	     * Is activation currently allowed, will always return true for static module agent
	     * @returns {boolean}
	     */
	    allowsActivation:function() {
	        return true;
	    },

	    /**
	     * Clean up
	     * As we have not attached any event listeners there's nothing to clean
	     */
	    destroy:function() {
	        // nothing to clean up
	    }
	};
	var ConditionModuleAgent = function(conditions,element) {

	    // if no conditions, conditions will always be suitable
	    if (typeof conditions !== 'string' || !conditions.length) {
	        return;
	    }

	    // conditions supplied, conditions are now unsuitable by default
	    this._suitable = false;

	    // set element reference
	    this._element = element;

	    // remember tester references in this array for later removal
	    this._testers = [];

	    // change event bind
	    this._onResultsChangedBind = this._onTestResultsChanged.bind(this);

	    // returns the amount of expressions in this expression
	    this._count = ExpressionFormatter.getExpressionsCount(conditions);

	    // load to expression tree
	    this._expression = ExpressionFormatter.fromString(conditions);

	    // load tests to expression tree
	    this._loadExpressionTests(this._expression.getConfig());

	};

	ConditionModuleAgent.prototype = {

	    /**
	     * Returns true if the current conditions allow module activation
	     * @return {Boolean}
	     * @public
	     */
	    allowsActivation:function() {
	        return this._suitable;
	    },

	    /**
	     * Cleans up event listeners and readies object for removal
	     */
	    destroy:function() {

	        var i=0,l=this._testers.length;
	        for (;i<l;i++) {

	            // no longer listen to change events on the tester
	            Observer.unsubscribe(this._testers[i],'change',this._onResultsChangedBind);

	            // further look into unloading the manufactured Test itself

	        }

	        this._testers = [];
	        this._suitable = false;

	    },

	    /**
	     * Tests if conditions are suitable
	     * @fires change
	     */
	    _test:function() {

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

	        var self = this,tester;

	        TestFactory.getTest(config.path,function(test) {

	            // create a new tester instance for this test
	            tester = new Tester(test,config.value,self._element);

	            // remember tester
	            self._testers.push(tester);

	            // assign tester to expression
	            expression.assignTester(tester);

	            // listen to test result updates
	            Observer.subscribe(test,'change',self._onResultsChangedBind);

	            // lower test count so we know when we're ready
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
	        this._test();

	        // we are now ready to start testing
	        Observer.publish(this,'ready');
	    },

	    /**
	     * Called when a condition has changed
	     * @private
	     */
	    _onTestResultsChanged:function() {
	        this._test();
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

	        var config,path,mod,alias;

			// update options
			this._options = mergeObjects(this._options,options);

			// loop over modules
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
	            node,
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
				nodes.push(new NodeController(element,element.getAttribute('data-priority')));
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
	            node = nodes[i];
				node.load.apply(node,this._getModuleControllersByElement(node.getElement()));
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
	                this._getModuleController(controller.path,element,controller.options,controller.conditions)
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

	        // create synced controller group using passed arguments
	        // test if user passed an array instead of separate arguments
	        SyncedControllerGroup.apply(group,arguments.length === 1 && !arguments.slice ? arguments[0] : arguments);

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
	            i= 0,
	            specs,spec,l,

	        // test if first character is a '[', if so multiple modules have been defined
	        multiple = config.charCodeAt(0) === 91;

	        if (multiple) {

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
	            l=specs.length;

	            // create specs
	            for (;i<l;i++) {
	                spec = specs[i];
	                controllers.push(
	                    this._getModuleController(spec.path,element,spec.options,spec.conditions)
	                );
	            }
	        }
	        else if (config.length) {
	            controllers.push(
	                this._getModuleController(config,element,element.getAttribute('data-options'),element.getAttribute('data-conditions'))
	            );
	        }

	        return controllers;
	    },

	    /**
	     * Module Controller factory method, creates different ModuleControllers based on params
	     * @param path - path of module
	     * @param element - element to attach module to
	     * @param options - options for module
	     * @param conditions - conditions required for module to be loaded
	     * @returns {ModuleController}
	     * @private
	     */
	    _getModuleController:function(path,element,options,conditions) {
	        return new ModuleController(
	            path,
	            element,
	            options,
	            conditions ? new ConditionModuleAgent(conditions,element) : StaticModuleAgent
	        );
	    }

	};

	return new ModuleLoader();

});