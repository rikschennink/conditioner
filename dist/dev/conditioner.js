// conditioner v1.0.0 - ConditionerJS - Frizz free, environment-aware, javascript modules.
// Copyright (c) 2014 Rik Schennink - http://conditionerjs.com
// License: MIT - http://www.opensource.org/licenses/mit-license.php
(function (undefined) {

    'use strict';

    // returns conditioner API
    var factory = function (require, Observer, Promise, contains, matchesSelector, mergeObjects) {

        /**
         * Test
         * @param {String} path to monitor
         * @param {String} expected value
         * @constructor
         */
        var Test = function Test(path, expected) {

            this._path = path;
            this._expected = expected;
            this._watches = [];
            this._count = 0;

        };

        Test.prototype = {

            /**
             * Returns a path to the required monitor
             * @returns {String}
             */
            getPath: function () {
                return this._path;
            },

            /**
             * Returns the expected value
             * @returns {String}
             */
            getExpected: function () {
                return this._expected;
            },

            /**
             * Returns true if monitor currently returns true state
             * @returns {Boolean}
             */
            isTrue: function () {
                var i = 0,
                    l = this._count;
                for (; i < l; i++) {
                    if (!this._watches[i].valid) {
                        return false;
                    }
                }
                return true;
            },

            /**
             * Assigns a new watch for this test
             * @param watches
             */
            assignWatches: function (watches) {
                this._watches = watches;
                this._count = watches.length;
            },

            /**
             * Returns test in path
             * @returns {String}
             */
            toString: function () {
                return this._path + ':{' + this._expected + '}';
            }

        };
        var Condition = function (expression, callback) {

            // get expression
            this._expression = expression;

            // on detect change callback
            this._change = callback;

            // default state is limbo
            this._currentState = null;

        };

        Condition.prototype = {

            /**
             * Evaluate expression, call change method if there's a diff with the last evaluation
             */
            evaluate: function () {
                var state = this._expression.isTrue();
                if (state != this._currentState) {
                    this._currentState = state;
                    this._change(state);
                }
            }

        };
        var WebContext = {

            test: function (query, element, change) {

                var expression, condition, i, tests, l;

                // convert query to expression
                expression = ExpressionParser.parse(query);

                // condition to evaluate on detect changes
                condition = new Condition(expression, change);

                // get found test setups from expression and register
                i = 0;
                tests = expression.getTests();
                l = tests.length;
                for (; i < l; i++) {
                    this._setupMonitor(

                    // test
                    tests[i],

                    // related element
                    element,

                    // re-evaluate this condition on change
                    condition

                    );
                }

            },

            _setupMonitor: function (test, element, condition) {

                var i = 0,
                    l;
                MonitorFactory.getInstance().create(test, element).then(function (watches) {

                    // multiple watches
                    test.assignWatches(watches);

                    // add value watches
                    l = watches.length;
                    for (; i < l; i++) {

                        // listen to change event on the watchers
                        // jshint -W083
                        Observer.subscribe(watches[i], 'change', function () {
                            condition.evaluate();
                        });

                    }

                    // do initial evaluation
                    condition.evaluate();

                });

            }

        };
        var MonitorFactory = (function (undefined) {

            var MonitorFactory = function () {
                this._monitors = [];
                this._expressions = [];
            };

            MonitorFactory.prototype = {

                /**
                 * Parse expression to deduct test names and expected values
                 * @param expression
                 * @returns {Array}
                 */
                parse: function (expression) {

                    // if earlier parse action found return that one
                    if (this._expressions[expression]) {
                        return this._expressions[expression];
                    }

                    // parse expression
                    var i = 0,
                        expressions = expression.split(','),
                        l = expressions.length,
                        result = [],
                        parts;
                    for (; i < l; i++) {
                        parts = expressions[i].split(':');
                        result.push({

                            // test name
                            test: parts[0],

                            // expected custom value or expect true by default
                            value: typeof parts[1] === 'undefined' ? true : parts[1]

                        });
                    }

                    // remember the resulting array
                    this._expressions[expression] = result;
                    return result;
                },

                /**
                 * Create a new Monitor based on passed configuration
                 * @param {Test} test
                 * @param {Element} element
                 * @returns {Promise}
                 */
                create: function (test, element) {

                    // setup promise
                    var p = new Promise();

                    // path to monitor
                    var path = test.getPath();

                    // expected value
                    var expected = test.getExpected();

                    // load monitor configuration
                    var self = this;
                    _options.loader.load(['./monitors/' + path], function (setup) {

                        var i = 0,
                            monitor = self._monitors[path],
                            l, watch, watches, items, event;

                        // bind trigger events for this setup if not defined yet
                        if (!monitor) {

                            // setup
                            monitor = {

                                // bound watches (each watch has own data object)
                                watches: [],

                                // change method
                                change: function () {
                                    i = 0;
                                    l = monitor.watches.length;
                                    for (; i < l; i++) {
                                        monitor.watches[i].test();
                                    }
                                }

                            };

                            // setup trigger events manually
                            if (typeof setup.trigger === 'function') {
                                setup.trigger(monitor.change, monitor.data);
                            }

                            // auto bind trigger events
                            else {
                                for (event in setup.trigger) {
                                    if (!setup.trigger.hasOwnProperty(event)) {
                                        continue;
                                    }
                                    setup.trigger[event].addEventListener(event, monitor.change, false);
                                }
                            }

                            // test if should remember this monitor or should create a new one on each match
                            if (!setup.unique) {
                                self._monitors[path] = monitor;
                            }
                        }

                        // add watches
                        watches = [];
                        items = monitor.parse ? monitor.parse(expected) : self.parse(expected);
                        l = items.length;

                        for (; i < l; i++) {

                            watch = {

                                // default limbo state before we've done any tests
                                valid: null,

                                // setup data holder for this watcher
                                data: mergeObjects(
                                setup.data, {
                                    element: element,
                                    expected: typeof setup.test === 'function' ? items[i].test : items[i].value
                                }),

                                // run test
                                // jshint -W083
                                test: (function (fn) {
                                    return function () {
                                        this.valid = fn(this.data);
                                    };
                                }(typeof setup.test === 'function' ? setup.test : setup.test[items[i].test]))

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

                }
            };

            var _instance;
            return {
                getInstance: function () {
                    if (!_instance) {
                        _instance = new MonitorFactory();
                    }
                    return _instance;
                }
            };

        }());
        /**
         * @class
         * @constructor
         * @param {UnaryExpression|BinaryExpression|Test} expression
         * @param {Boolean} negate
         */
        var UnaryExpression = function (expression, negate) {

            this._expression = expression;
            this._negate = typeof negate === 'undefined' ? false : negate;

        };

        /**
         * Tests if valid expression
         * @returns {Boolean}
         */
        UnaryExpression.prototype.isTrue = function () {
            return this._expression.isTrue() !== this._negate;
        };

        /**
         * Returns tests contained in this expression
         * @returns Array
         */
        UnaryExpression.prototype.getTests = function () {
            return this._expression instanceof Test ? [this._expression] : this._expression.getTests();
        };

        /**
         * Cast to string
         * @returns {string}
         */
        UnaryExpression.prototype.toString = function () {
            return (this._negate ? 'not ' : '') + this._expression.toString();
        };
        /**
         * @class
         * @constructor
         * @param {UnaryExpression} a
         * @param {String} operator
         * @param {UnaryExpression} b
         */
        var BinaryExpression = function (a, operator, b) {

            this._a = a;
            this._operator = operator;
            this._b = b;

        };

        /**
         * Tests if valid expression
         * @returns {Boolean}
         */
        BinaryExpression.prototype.isTrue = function () {

            return this._operator === 'and' ?

            // is 'and' operator
            this._a.isTrue() && this._b.isTrue() :

            // is 'or' operator
            this._a.isTrue() || this._b.isTrue();

        };

        /**
         * Returns tests contained in this expression
         * @returns Array
         */
        BinaryExpression.prototype.getTests = function () {
            return this._a.getTests().concat(this._b.getTests());
        };

        /**
         * Outputs the expression as a string
         * @returns {String}
         */
        BinaryExpression.prototype.toString = function () {
            return '(' + this._a.toString() + ' ' + this._operator + ' ' + this._b.toString() + ')';
        };
        var ExpressionParser = {

            /**
             * Parses an expression in string format and returns the same expression formatted as an expression tree
             * @memberof ExpressionFormatter
             * @param {String} expression
             * @returns {UnaryExpression|BinaryExpression}
             * @public
             */
            parse: function (expression) {

                var i = 0,
                    path = '',
                    tree = [],
                    value = '',
                    negate = false,
                    isValue = false,
                    target = null,
                    parent = null,
                    parents = [],
                    l = expression.length,
                    lastIndex, index, operator, test, j, c, k, n, op, ol, tl;

                if (!target) {
                    target = tree;
                }

                // read explicit expressions
                for (; i < l; i++) {

                    c = expression.charCodeAt(i);

                    // check if an expression, test for '{'
                    if (c === 123) {

                        // now reading the expression
                        isValue = true;

                        // reset path var
                        path = '';

                        // fetch path
                        k = i - 2;
                        while (k >= 0) {
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

                        lastIndex = target.length - 1;
                        index = lastIndex + 1;

                        // negate if last index contains not operator
                        negate = target[lastIndex] === 'not';

                        // if negate overwrite not operator location in array
                        index = negate ? lastIndex : lastIndex + 1;

                        // setup test
                        test = new Test(path, value);

                        // add expression
                        target[index] = new UnaryExpression(
                        test, negate);

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
                        target = target[target.length - 1];

                    }

                    // find out if next set of characters is a logical operator. Testing for ' ' or '('
                    if (c === 32 || i === 0 || c === 40) {

                        operator = expression.substr(i, 5).match(/and |or |not /g);
                        if (!operator) {
                            continue;
                        }

                        // get reference and calculate length
                        op = operator[0];
                        ol = op.length - 1;

                        // add operator
                        target.push(op.substring(0, ol));

                        // skip over operator
                        i += ol;
                    }

                    // expression or level finished, time to clean up. Testing for ')'
                    if (c === 41 || i === l - 1) {

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
                            j = 0;
                            tl = target.length;

                            for (; j < tl; j++) {

                                if (typeof target[j] !== 'string') {
                                    continue;
                                }

                                // handle not expressions first
                                if (target[j] === 'not') {
                                    target.splice(j, 2, new UnaryExpression(target[j + 1], true));

                                    // rewind
                                    j = -1;
                                    tl = target.length;
                                }
                                // handle binary expression
                                else if (target[j + 1] !== 'not') {
                                    target.splice(j - 1, 3, new BinaryExpression(target[j - 1], target[j], target[j + 1]));

                                    // rewind
                                    j = -1;
                                    tl = target.length;
                                }

                            }

                            // if contains only one element
                            if (target.length === 1 && parent) {

                                // overwrite target index with target content
                                parent[parent.length - 1] = target[0];

                                // set target to parent array
                                target = parent;

                            }

                        }
                        while (i === l - 1 && parent);

                    }
                    // end of ')' character or last index
                }

                // return final expression tree
                //return {
                return tree.length === 1 ? tree[0] : tree;
                //     tests:test
                //};
            }

        };
        /**
         * Static Module Agent, will always load the module
         * @type {Object}
         */
        var StaticModuleAgent = {

            /**
             * Initialize, resolved immediately
             * @returns {Promise}
             */
            init: function (ready) {
                ready();
            },

            /**
             * Is activation currently allowed, will always return true for static module agent
             * @returns {boolean}
             */
            allowsActivation: function () {
                return true;
            },

            /**
             * Clean up
             * As we have not attached any event listeners there's nothing to clean
             */
            destroy: function () {
                // nothing to clean up
            }
        };
        var ConditionModuleAgent = function (conditions, element) {

            // if no conditions, conditions will always be suitable
            if (typeof conditions !== 'string' || !conditions.length) {
                return;
            }

            this._conditions = conditions;
            this._element = element;
            this._state = false;

        };

        ConditionModuleAgent.prototype = {

            /**
             * Initialize, resolve on first test results
             * @returns {Promise}
             */
            init: function (ready) {

                var self = this,
                    init = false;
                WebContext.test(this._conditions, this._element, function (valid) {

                    // something changed
                    self._state = valid;

                    // notify others of this state change
                    Observer.publish(self, 'change');

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
            allowsActivation: function () {
                return this._state;
            },

            /**
             * Cleans up event listeners and readies object for removal
             */
            destroy: function () {

                // destroy
            }

        };
        var ModuleRegistry = {

            _options: {},
            _redirects: {},

            /**
             * Register a module
             * @param {String} path - path to module
             * @param {Object} options - configuration to setup for module
             * @param {String} alias - alias name for module
             * @static
             */
            registerModule: function (path, options, alias) {

                // remember options for absolute path
                this._options[_options.loader.toUrl(path)] = options;

                // setup redirect from alias
                if (alias) {
                    this._redirects[alias] = path;
                }

                // pass configuration to loader
                _options.loader.config(path, options);
            },

            /**
             * Returns the actual path if the path turns out to be a redirect
             * @param path
             * @returns {*}
             */
            getRedirect: function (path) {
                return this._redirects[path] || path;
            },

            /**
             * Get a registered module by path
             * @param {String} path - path to module
             * @return {Object} - module specification object
             * @static
             */
            getModule: function (path) {

                // if no id supplied throw error
                if (!path) {
                    throw new Error('ModuleRegistry.getModule(path): "path" is a required parameter.');
                }

                return this._options[path] || this._options[_options.loader.toUrl(path)];

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
        var ModuleController = function (path, element, options, agent) {

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
            this._onAgentStateChangeBind = this._onAgentStateChange.bind(this);

            // wait for init to complete
            var self = this;
            this._agent.init(function () {
                self._initialize();
            });

        };

        ModuleController.prototype = {

            /**
             * returns true if the module controller has initialized
             * @returns {Boolean}
             */
            hasInitialized: function () {
                return this._initialized;
            },

            /**
             * Returns the module path
             * @returns {String}
             * @public
             */
            getModulePath: function () {
                return this._path;
            },

            /**
             * Returns true if the module is currently waiting for load
             * @returns {Boolean}
             * @public
             */
            isModuleAvailable: function () {
                return this._agent.allowsActivation() && !this._module;
            },

            /**
             * Returns true if module is currently active and loaded
             * @returns {Boolean}
             * @public
             */
            isModuleActive: function () {
                return this._module !== null;
            },

            /**
             * Checks if it wraps a module with the supplied path
             * @param {String} path - path of module to test for
             * @return {Boolean}
             * @public
             */
            wrapsModuleWithPath: function (path) {
                return this._path === path || this._alias === path;
            },

            /**
             * Called to initialize the module
             * @private
             * @fires init
             */
            _initialize: function () {

                // now in initialized state
                this._initialized = true;

                // listen to behavior changes
                Observer.subscribe(this._agent, 'change', this._onAgentStateChangeBind);

                // let others know we have initialized
                Observer.publishAsync(this, 'init', this);

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
            _onBecameAvailable: function () {

                // we are now available
                Observer.publishAsync(this, 'available', this);

                // let's load the module
                this._load();

            },

            /**
             * Called when the agent state changes
             * @private
             */
            _onAgentStateChange: function () {

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
            _load: function () {

                // if module available no need to require it
                if (this._Module) {
                    this._onLoad();
                    return;
                }

                // load module, and remember reference
                var self = this;
                _options.loader.load([this._path], function (Module) {

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
            _optionsToObject: function (options) {
                if (typeof options === 'string') {
                    try {
                        return JSON.parse(options);
                    }
                    catch (e) {
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
            _parseOptions: function (url, Module, overrides) {

                var stack = [],
                    pageOptions = {},
                    moduleOptions = {},
                    options, i;
                do {

                    // get settings
                    options = ModuleRegistry.getModule(url);

                    // stack the options
                    stack.push({
                        'page': options,
                        'module': Module.options
                    });

                    // fetch super path
                    url = Module.__superUrl;

                    // jshint -W084
                } while (Module = Module.__super);

                // reverse loop over stack and merge options
                i = stack.length;
                while (i--) {
                    pageOptions = mergeObjects(pageOptions, stack[i].page);
                    moduleOptions = mergeObjects(moduleOptions, stack[i].module);
                }

                // merge page and module options
                options = mergeObjects(moduleOptions, pageOptions);

                // apply overrides
                if (overrides) {
                    options = mergeObjects(options, this._optionsToObject(overrides));
                }

                return options;
            },

            /**
             * Method called when module loaded
             * @fires load
             * @private
             */
            _onLoad: function () {

                // if activation is no longer allowed, stop here
                if (!this._agent.allowsActivation()) {
                    return;
                }

                // parse and merge options for this module
                var options = this._parseOptions(this._path, this._Module, this._options);

                // set reference
                if (typeof this._Module === 'function') {

                    // is of function type so try to create instance
                    this._module = new this._Module(this._element, options);
                }
                else {

                    // is of other type so expect load method to be defined
                    this._module = this._Module.load ? this._Module.load(this._element, options) : null;

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
                Observer.inform(this._module, this);

                // publish load event
                Observer.publishAsync(this, 'load', this);
            },


            /**
             * Unloads the wrapped module
             * @fires unload
             * @return {Boolean}
             */
            _unload: function () {

                // module is now no longer ready to be loaded
                this._available = false;

                // if no module, module has already been unloaded or was never loaded
                if (!this._module) {
                    return false;
                }

                // stop watching target
                Observer.conceal(this._module, this);

                // unload module if possible
                if (this._module.unload) {
                    this._module.unload();
                }

                // reset property
                this._module = null;

                // publish unload event
                Observer.publishAsync(this, 'unload', this);

                return true;
            },

            /**
             * Cleans up the module and module controller and all bound events
             * @public
             */
            destroy: function () {

                // unload module
                this._unload();

                // unbind events
                Observer.unsubscribe(this._agent, 'ready', this._onAgentReadyBind);
                Observer.unsubscribe(this._agent, 'change', this._onAgentStateChangeBind);

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
            execute: function (method, params) {

                // if module not loaded
                if (!this._module) {
                    return {
                        'status': 404,
                        'response': null
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
                    'status': 200,
                    'response': F.apply(this._module, params)
                };

            }

        };
        var NodeController = (function () {

            var _filterIsActiveModule = function (item) {
                return item.isModuleActive();
            };
            var _filterIsAvailableModule = function (item) {
                return item.isModuleAvailable();
            };
            var _mapModuleToPath = function (item) {
                return item.getModulePath();
            };

            /**
             * @class
             * @constructor
             * @param {Object} element
             * @param {Number} priority
             */
            var exports = function NodeController(element, priority) {

                if (!element) {
                    throw new Error('NodeController(element): "element" is a required parameter.');
                }

                // set element reference
                this._element = element;

                // has been processed
                this._element.setAttribute(_options.attr.processed, 'true');

                // set priority
                this._priority = !priority ? 0 : parseInt(priority, 10);

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
            exports.hasProcessed = function (element) {
                return element.getAttribute(_options.attr.processed) === 'true';
            };

            exports.prototype = {

                /**
                 * Loads the passed module controllers to the node
                 * @param {...} arguments
                 * @public
                 */
                load: function () {

                    // if no module controllers found
                    if (!arguments || !arguments.length) {
                        throw new Error('NodeController.load(controllers): Expects an array of module controllers as parameters.');
                    }

                    // turn into array
                    this._moduleControllers = Array.prototype.slice.call(arguments, 0);

                    // listen to load events on module controllers
                    var i = 0,
                        l = this._moduleControllers.length,
                        mc;
                    for (; i < l; i++) {
                        mc = this._moduleControllers[i];
                        Observer.subscribe(mc, 'available', this._moduleAvailableBind);
                        Observer.subscribe(mc, 'load', this._moduleLoadBind);
                    }

                },

                /**
                 * Unload all attached modules and restore node in original state
                 * @public
                 */
                destroy: function () {

                    var i = 0,
                        l = this._moduleControllers.length;
                    for (; i < l; i++) {
                        this._destroyModule(this._moduleControllers[i]);
                    }

                    // reset array
                    this._moduleControllers = [];

                    // update initialized state
                    this._updateAttribute(_options.attr.initialized, this._moduleControllers);

                    // reset processed state
                    this._element.removeAttribute(_options.attr.processed);

                    // clear reference
                    this._element = null;
                },

                /**
                 * Call destroy method on module controller and clean up listeners
                 * @param moduleController
                 * @private
                 */
                _destroyModule: function (moduleController) {

                    // unsubscribe from module events
                    Observer.unsubscribe(moduleController, 'available', this._moduleAvailableBind);
                    Observer.unsubscribe(moduleController, 'load', this._moduleLoadBind);
                    Observer.unsubscribe(moduleController, 'unload', this._moduleUnloadBind);

                    // conceal events from module controller
                    Observer.conceal(moduleController, this);

                    // unload the controller
                    moduleController.destroy();

                },

                /**
                 * Returns the set priority for this node
                 * @public
                 */
                getPriority: function () {
                    return this._priority;
                },

                /**
                 * Returns the element linked to this node
                 * @public
                 */
                getElement: function () {
                    return this._element;
                },

                /**
                 * Public method to check if the module matches the given query
                 * @param {String} selector - CSS selector to match module to
                 * @param {Document|Element} [context] - Context to search in
                 * @return {Boolean}
                 * @public
                 */
                matchesSelector: function (selector, context) {
                    if (context && !contains(context, this._element)) {
                        return false;
                    }
                    return matchesSelector(this._element, selector, context);
                },

                /**
                 * Returns true if all module controllers are active
                 * @public
                 */
                areAllModulesActive: function () {
                    return this.getActiveModules().length === this._moduleControllers.length;
                },

                /**
                 * Returns an array containing all active module controllers
                 * @return {Array}
                 * @public
                 */
                getActiveModules: function () {
                    return this._moduleControllers.filter(_filterIsActiveModule);
                },

                /**
                 * Returns the first ModuleController matching the given path
                 * @param {String} [path] - module id
                 * @return {ModuleController|null}
                 * @public
                 */
                getModule: function (path) {
                    return this._getModules(path, true);
                },

                /**
                 * Returns an array of ModuleControllers matching the given path
                 * @param {String} [path] to module
                 * @return {Array}
                 * @public
                 */
                getModules: function (path) {
                    return this._getModules(path);
                },

                /**
                 * Returns one or multiple ModuleControllers matching the supplied path
                 * @param {String} [path] - Optional path to match the nodes to
                 * @param {Boolean} [singleResult] - Optional boolean to only ask for one result
                 * @returns {Array|ModuleController|null}
                 * @private
                 */
                _getModules: function (path, singleResult) {

                    // if no path supplied return all module controllers (or one if single result mode)
                    if (typeof path === 'undefined') {
                        if (singleResult) {
                            return this._moduleControllers[0];
                        }
                        return this._moduleControllers.concat();
                    }

                    // loop over module controllers matching the path, if single result is enabled, return on first hit, else collect
                    var i = 0,
                        l = this._moduleControllers.length,
                        results = [],
                        mc;
                    for (; i < l; i++) {
                        mc = this._moduleControllers[i];
                        if (!mc.wrapsModuleWithPath(path)) {
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
                execute: function (method, params) {
                    return this._moduleControllers.map(function (item) {
                        return {
                            controller: item,
                            result: item.execute(method, params)
                        };
                    });
                },

                /**
                 * Called when a module becomes available for load
                 * @param moduleController
                 * @private
                 */
                _onModuleAvailable: function (moduleController) {

                    // propagate events from the module controller to the node so people can subscribe to events on the node
                    Observer.inform(moduleController, this);

                    // update loading attribute with currently loading module controllers list
                    this._updateAttribute(_options.attr.loading, this._moduleControllers.filter(_filterIsAvailableModule));
                },

                /**
                 * Called when module has loaded
                 * @param moduleController
                 * @private
                 */
                _onModuleLoad: function (moduleController) {

                    // listen to unload event
                    Observer.unsubscribe(moduleController, 'load', this._moduleLoadBind);
                    Observer.subscribe(moduleController, 'unload', this._moduleUnloadBind);

                    // update loading attribute with currently loading module controllers list
                    this._updateAttribute(_options.attr.loading, this._moduleControllers.filter(_filterIsAvailableModule));

                    // update initialized attribute with currently active module controllers list
                    this._updateAttribute(_options.attr.initialized, this.getActiveModules());
                },

                /**
                 * Called when module has unloaded
                 * @param moduleController
                 * @private
                 */
                _onModuleUnload: function (moduleController) {

                    // stop listening to unload
                    Observer.subscribe(moduleController, 'load', this._moduleLoadBind);
                    Observer.unsubscribe(moduleController, 'unload', this._moduleUnloadBind);

                    // conceal events from module controller
                    Observer.conceal(moduleController, this);

                    // update initialized attribute with now active module controllers list
                    this._updateAttribute(_options.attr.initialized, this.getActiveModules());
                },

                /**
                 * Updates the given attribute with paths of the supplied controllers
                 * @private
                 */
                _updateAttribute: function (attr, controllers) {
                    var modules = controllers.map(_mapModuleToPath);
                    if (modules.length) {
                        this._element.setAttribute(attr, modules.join(','));
                    }
                    else {
                        this._element.removeAttribute(attr);
                    }
                }

            };

            return exports;

        }());
        /**
         * Creates a controller group to sync controllers
         * @constructor
         */
        var SyncedControllerGroup = function () {

            // if no node controllers passed, no go
            if (!arguments || !arguments.length) {
                throw new Error('SyncedControllerGroup(controllers): Expects an array of node controllers as parameters.');
            }

            // by default modules are expected to not be in sync
            this._inSync = false;

            // turn arguments into an array
            this._controllers = arguments.length === 1 ? arguments[0] : Array.prototype.slice.call(arguments, 0);
            this._controllerLoadedBind = this._onLoad.bind(this);
            this._controllerUnloadedBind = this._onUnload.bind(this);

            var i = 0,
                controller, l = this._controllers.length;
            for (; i < l; i++) {
                controller = this._controllers[i];

                // if controller is undefined
                if (!controller) {
                    throw new Error('SyncedControllerGroup(controllers): Stumbled upon an undefined controller is undefined.');
                }

                // listen to load and unload events so we can pass them on if appropriate
                Observer.subscribe(controller, 'load', this._controllerLoadedBind);
                Observer.subscribe(controller, 'unload', this._controllerUnloadedBind);
            }

            // test now to see if modules might already be in sync
            this._test();
        };

        SyncedControllerGroup.prototype = {

            /**
             * Destroy sync group, stops listening and cleans up
             */
            destroy: function () {

                // unsubscribe
                var i = 0,
                    controller, l = this._controllers.length;
                for (; i < l; i++) {
                    controller = this._controllers[i];

                    // listen to load and unload events so we can pass them on if appropriate
                    Observer.unsubscribe(controller, 'load', this._controllerLoadedBind);
                    Observer.unsubscribe(controller, 'unload', this._controllerUnloadedBind);
                }

                // reset array
                this._controllers = [];

            },

            /**
             * Returns true if all modules have loaded
             * @returns {Boolean}
             */
            areAllModulesActive: function () {
                var i = 0,
                    l = this._controllers.length,
                    controller;
                for (; i < l; i++) {
                    controller = this._controllers[i];
                    if (!this._isActiveController(controller)) {
                        return false;
                    }
                }
                return true;
            },

            /**
             * Called when a module loads
             * @private
             */
            _onLoad: function () {
                this._test();
            },

            /**
             * Called when a module unloads
             * @private
             */
            _onUnload: function () {
                this._unload();
            },

            /**
             * Tests if the node or module controller has loaded their modules
             * @param controller
             * @returns {Boolean}
             * @private
             */
            _isActiveController: function (controller) {
                return ((controller.isModuleActive && controller.isModuleActive()) || (controller.areAllModulesActive && controller.areAllModulesActive()));
            },

            /**
             * Tests if all controllers have loaded, if so calls the _load method
             * @private
             */
            _test: function () {

                // loop over modules testing their active state, if one is inactive we stop immediately
                if (!this.areAllModulesActive()) {
                    return;
                }

                // if all modules loaded fire load event
                this._load();

            },

            /**
             * Fires a load event when all controllers have indicated they have loaded and we have not loaded yet
             * @fires load
             * @private
             */
            _load: function () {
                if (this._inSync) {
                    return;
                }
                this._inSync = true;
                Observer.publishAsync(this, 'load', this._controllers);
            },

            /**
             * Fires an unload event once we are in loaded state and one of the controllers unloads
             * @fires unload
             * @private
             */
            _unload: function () {
                if (!this._inSync) {
                    return;
                }
                this._inSync = false;
                Observer.publish(this, 'unload', this._controllers);
            }

        };
        /**
         * @exports ModuleLoader
         * @class
         * @constructor
         */
        var ModuleLoader = function () {

            // array of all parsed nodes
            this._nodes = [];

        };

        ModuleLoader.prototype = {

            /**
             * Loads all modules within the supplied dom tree
             * @param {Document|Element} context - Context to find modules in
             * @return {Array} - Array of found Nodes
             */
            parse: function (context) {

                // if no context supplied, throw error
                if (!context) {
                    throw new Error('ModuleLoader.loadModules(context): "context" is a required parameter.');
                }

                // register vars and get elements
                var elements = context.querySelectorAll('[data-module]'),
                    l = elements.length,
                    i = 0,
                    nodes = [],
                    node, element;

                // if no elements do nothing
                if (!elements) {
                    return [];
                }

                // process elements
                for (; i < l; i++) {

                    // set element reference
                    element = elements[i];

                    // test if already processed
                    if (NodeController.hasProcessed(element)) {
                        continue;
                    }

                    // create new node
                    nodes.push(new NodeController(element, element.getAttribute(_options.attr.priority)));
                }

                // sort nodes by priority:
                // higher numbers go first,
                // then 0 (a.k.a. no priority assigned),
                // then negative numbers
                // note: it's actually the other way around but that's because of the reversed while loop coming next
                nodes.sort(function (a, b) {
                    return a.getPriority() - b.getPriority();
                });

                // initialize modules depending on assigned priority (in reverse, but priority is reversed as well so all is okay)
                i = nodes.length;
                while (--i >= 0) {
                    node = nodes[i];
                    node.load.apply(node, this._getModuleControllersByElement(node.getElement()));
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
            load: function (element, controllers) {

                if (!controllers) {
                    return null;
                }

                // if controllers is object put in array
                controllers = controllers.length ? controllers : [controllers];

                // vars
                var node, i = 0,
                    l = controllers.length,
                    moduleControllers = [],
                    controller;

                // create node
                node = new NodeController(element);

                // create controllers
                for (; i < l; i++) {
                    controller = controllers[i];
                    moduleControllers.push(
                    this._getModuleController(controller.path, element, controller.options, controller.conditions));
                }

                // create initialize
                node.load(moduleControllers);

                // remember so can later be retrieved through getNode methodes
                this._nodes.push(node);

                // return the loaded Node
                return node;
            },

            /**
             * Destroy the passed node reference
             * @param node {NodeController}
             * @return {Boolean}
             * @public
             */
            destroyNode: function (node) {
                var i = this._nodes.length;
                while (i--) {
                    if (this._nodes[i] !== node) {
                        continue;
                    }
                    this._nodes.splice(i, 1);
                    node.destroy();
                    return true;
                }
                return false;
            },

            /**
             * Returns one or multiple nodes matching the selector
             * @param {String} [selector] - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @param {Boolean} [singleResult] - Optional boolean to only ask one result
             * @returns {Array|Node|null}
             * @public
             */
            getNodes: function (selector, context, singleResult) {

                // if no query supplied return all nodes
                if (typeof selector === 'undefined' && typeof context === 'undefined') {
                    if (singleResult) {
                        return this._nodes[0];
                    }
                    return this._nodes.concat();
                }

                // find matches (done by querying the node for a match)
                var i = 0,
                    l = this._nodes.length,
                    results = [],
                    node;
                for (; i < l; i++) {
                    node = this._nodes[i];
                    if (node.matchesSelector(selector, context)) {
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
            _getModuleControllersByElement: function (element) {

                var controllers = [],
                    config = element.getAttribute(_options.attr.module) || '',
                    i = 0,
                    specs, spec, l,

                    // test if first character is a '[', if so multiple modules have been defined
                    multiple = config.charCodeAt(0) === 91;

                if (multiple) {

                    // add multiple module adapters
                    try {
                        specs = JSON.parse(config);
                    }
                    catch (e) {
                        // failed parsing spec
                        throw new Error('ModuleLoader.load(context): "data-module" attribute contains a malformed JSON string.');
                    }

                    // no specification found or specification parsing failed
                    if (!specs) {
                        return [];
                    }

                    // setup vars
                    l = specs.length;

                    // create specs
                    for (; i < l; i++) {
                        spec = specs[i];
                        controllers.push(
                        this._getModuleController(spec.path, element, spec.options, spec.conditions));
                    }
                }
                else if (config.length) {
                    controllers.push(
                    this._getModuleController(config, element, element.getAttribute(_options.attr.options), element.getAttribute(_options.attr.conditions)));
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
            _getModuleController: function (path, element, options, conditions) {
                return new ModuleController(
                path, element, options, conditions ? new ConditionModuleAgent(conditions, element) : StaticModuleAgent);
            }

        };

        // conditioner options object
        var _options = {
            'attr': {
                'options': 'data-options',
                'module': 'data-module',
                'conditions': 'data-conditions',
                'priority': 'data-priority',
                'initialized': 'data-initialized',
                'processed': 'data-processed',
                'loading': 'data-loading'
            },
            'loader': {
                'load': function (paths, callback) {
                    require(paths, callback);
                },
                'config': function (path, options) {
                    var config = {};
                    config[path] = options;
                    requirejs.config({
                        config: config
                    });
                },
                'toUrl': function (path) {
                    return requirejs.toUrl(path);
                }
            },
            'modules': {}
        };

        // setup loader instance
        var _loader = new ModuleLoader();

        // expose API
        return {

            /**
             * Initialises the conditioner and parses the document for modules
             * @param {Object} [options] - optional options to override
             * @return {Array} of initialized nodes
             * @public
             */
            init: function (options) {

                if (options) {
                    this.setOptions(options);
                }

                return _loader.parse(document);

            },

            /**
             * Set custom options
             * @param {Object} options - options to override
             * @public
             */
            setOptions: function (options) {

                if (!options) {
                    throw new Error('Conditioner.setOptions(options): "options" is a required parameter.');
                }

                var config, path, mod, alias;

                // update options
                _options = mergeObjects(_options, options);

                // loop over modules
                for (path in _options.modules) {

                    if (!_options.modules.hasOwnProperty(path)) {
                        continue;
                    }

                    // get module reference
                    mod = _options.modules[path];

                    // get alias
                    alias = typeof mod === 'string' ? mod : mod.alias;

                    // get config
                    config = typeof mod === 'string' ? null : mod.options || {};

                    // register this module
                    ModuleRegistry.registerModule(path, config, alias);

                }

            },

            /**
             * Loads all modules within the supplied dom tree
             * @param {Document|Element} context - Context to find modules in
             * @return {Array} - Array of found Nodes
             */
            parse: function (context) {

                if (!context) {
                    throw new Error('Conditioner.parse(context): "context" is a required parameter.');
                }

                return _loader.parse(context);

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
            load: function (element, controllers) {

                return _loader.load(element, controllers);

            },

            /**
             * Returns a synced controller group which fires a load event once all modules have loaded
             * {ModuleController|NodeController} [arguments] - list of module controllers or node controllers to synchronize
             * @return SyncedControllerGroup.prototype
             */
            sync: function () {

                var group = Object.create(SyncedControllerGroup.prototype);

                // create synced controller group using passed arguments
                // test if user passed an array instead of separate arguments
                SyncedControllerGroup.apply(group, arguments.length === 1 && !arguments.slice ? arguments[0] : arguments);

                return group;

            },

            /**
             * Returns the first Node matching the selector
             * @param {String} [selector] - Selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @return {Node|null} First matched node or null
             */
            getNode: function (selector, context) {

                return _loader.getNodes(selector, context, true);

            },

            /**
             * Returns all nodes matching the selector
             * @param {String} [selector] - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @return {Array} Array containing matched nodes or empty Array
             */
            getNodes: function (selector, context) {

                return _loader.getNodes(selector, context, false);

            },

            /**
             * Destroy the passed node reference
             * @param node {NodeController}
             * @return {Boolean}
             * @public
             */
            destroyNode: function (node) {

                return _loader.destroyNode(node);

            },

            /**
             * Returns the first Module matching the selector
             * @param {String} path - Optional path to match the modules to
             * @param {String} selector - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @public
             */
            getModule: function (path, selector, context) {

                var i = 0,
                    results = this.getNodes(selector, context),
                    l = results.length,
                    module;
                for (; i < l; i++) {
                    module = results[i].getModule(path);
                    if (module) {
                        return module;
                    }
                }
                return null;

            },

            /**
             * Returns multiple modules matching the given path
             * @param {String} path - Optional path to match the modules to
             * @param {String} selector - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @returns {Array|Node|null}
             * @public
             */
            getModules: function (path, selector, context) {

                var i = 0,
                    results = this.getNodes(selector, context),
                    l = results.length,
                    filtered = [],
                    modules;
                for (; i < l; i++) {
                    modules = results[i].getModules(path);
                    if (modules.length) {
                        filtered = filtered.concat(modules);
                    }
                }
                return filtered;

            },

            /**
             * Manual run an expression
             * @param {String} conditions - Expression to test
             * @param {Element} [element] - Optional element to run the test on
             * @returns {Promise}
             */
            test: function (conditions, element) {

                if (!conditions) {
                    throw new Error('Conditioner.test(conditions): "conditions" is a required parameter.');
                }

                // run test and resolve with first received state
                var p = new Promise();
                WebContext.test(conditions, element, function (valid) {
                    p[valid ? 'resolve' : 'reject']();
                });
                return p;

            }

        };

    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require, require('./utils/Observer'), require('./utils/Promise'), require('./utils/contains'), require('./utils/matchesSelector'), require('./utils/mergeObjects'));
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(['require', './utils/Observer', './utils/Promise', './utils/contains', './utils/matchesSelector', './utils/mergeObjects'], factory);
    }
    // Browser globals
    else {
        throw new Error('To use ConditionerJS you need to setup a module loader like RequireJS.');
    }

}());