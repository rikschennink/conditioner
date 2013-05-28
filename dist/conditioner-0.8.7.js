// conditioner v0.8.7 - ConditionerJS - Take control of your JavaScript modules.
// Copyright (c) 2013 Rik Schennink - http://rikschennink.github.io/conditioner
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
define(['require'],function(require) {

    'use strict';

    /**
     * @module conditioner
     */
    /**
     * @namespace Utils
     */
    var Utils = (function(){

        // define method used for matchesSelector
        var _method = null,el = document ? document.body : null;
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

        var exports = {

            /**
             * Based on https://github.com/nrf110/deepmerge/blob/master/index.js
             * @memberof Utils
             * @param target {Object}
             * @param src {Object}
             * @returns {Object}
             * @static
             */
            mergeObjects:function(target, src) {

                var array = Array.isArray(src);
                var dst = array && [] || {};

                src = src || {};

                if (array) {

                    target = target || [];
                    dst = dst.concat(target);

                    src.forEach(function(e, i) {

                        if (typeof e === 'object') {
                            dst[i] = exports.mergeObjects(target[i], e);
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
                                dst[key] = exports.mergeObjects(target[key], src[key]);
                            }
                        }

                    });
                }

                return dst;
            },

            /**
             * matches an element to a selector
             * @memberof Utils
             * @param {Element} element
             * @param {String} selector
             * @return {Boolean}
             * @static
             */
            matchesSelector:function(element,selector) {
                if (!element || !_method) {
                    return false;
                }
                return element[_method](selector);
            }

        };

        return exports;

    }());
    /**
     * @namespace Observer
     */
    var Observer = {

        /**
         * Subscribe to an event
         * @memberof observer
         * @param {Object} obj - Object to subscribe to
         * @param {String} type - Event type to listen for
         * @param {Function} fn - Function to call when event fires
         * @static
         */
        subscribe:function(obj,type,fn) {

            if (!obj._subscriptions) {
                obj._subscriptions = [];
            }

            // check if already added
            var test,i=0,l=obj._subscriptions;
            for (; i<l; i++) {
                test = obj._subscriptions[i];
                if (test.type === type && test.fn === fn) {
                    return;
                }
            }

            // add event
            obj._subscriptions.push({'type':type,'fn':fn});
        },

        /**
         * Unsubscribe from further notifications
         * @memberof observer
         * @param {Object} obj - Object to unsubscribe from
         * @param {String} type - Event type to match
         * @param {Function} fn - Function to match
         * @static
         */
        unsubscribe:function(obj,type,fn) {

            if (!obj._subscriptions) {
                return;
            }

            // find and remove
            var test,i=obj._subscriptions.length;
            while (--i >= 0) {
                test = obj._subscriptions[i];
                if (test.type === type && test.fn === fn) {
                    obj._subscriptions.splice(i,1);
                    break;
                }
            }
        },

        /**
         * Publish an event
         * @memberof observer
         * @param {Object} obj - Object to fire the event on
         * @param {String} type - Event type to fire
         * @param {Object} data - optional data carrier
         * @static
         */
        publish:function(obj,type,data) {

            if (!obj._subscriptions) {
                obj._subscriptions = [];
            }

            // find and execute callback
            var subscriptions=[],subscription,i=0,l = obj._subscriptions.length;
            for (;i<l;i++) {
                subscription = obj._subscriptions[i];
                if (subscription.type === type) {
                    subscriptions.push(subscription);
                }
            }

            // call callbacks
            l = subscriptions.length;
            for (i=0;i<l;i++) {
                subscriptions[i].fn(data);
            }

            // see if should be propagated
            if (obj._eventPropagationTarget) {
                this.publish(obj._eventPropagationTarget,type,data);
            }

        },

        /**
         * Setup propagation target for events so they can bubble up the object tree
         * @memberof observer
         * @param {Object} obj - Object to set as origin
         * @param {Object} target - Object to set as target
         * @return {Boolean} if setup was successful
         * @static
         */
        setupPropagationTarget:function(obj,target) {
            if (!obj || !target) {
                return false;
            }
            obj._eventPropagationTarget = target;
            return true;
        },

        /**
         * Remove propagation target
         * @memberof observer
         * @param {Object} obj - Object set as origin
         * @param {Object} target - Object set as target
         * @return {Boolean} if removed successful
         * @static
         */
        removePropagationTarget:function(obj,target) {

            if (!obj || !target) {
                return false;
            }

            if (obj._eventPropagationTarget === target) {
                obj._eventPropagationTarget = null;
                return true;
            }

            return false;
        }
    };
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
    /**
     * @namespace ExpressionFormatter
     */
    var ExpressionFormatter = {

        /**
         * Returns the amount of sub expressions contained in the supplied expression
         * @memberof ExpressionFormatter
         * @param expression {String}
         * @returns {Number}
         * @public
         */
        getExpressionsCount:function(expression) {
            return expression.match(/(:\{)/g).length;
        },

        /**
         * Parses an expression in string format and returns the same expression formatted as an expression tree
         * @memberof ExpressionFormatter
         * @param expression {String}
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

                c = expression.charAt(i);

                // check if an expression
                if (c === '{') {

                    // now reading the expression
                    isValue = true;

                    // reset path var
                    path = '';

                    // fetch path
                    k = i-2;
                    while(k>=0) {
                        n = expression.charAt(k);
                        if (n === ' ' || n === '(') {
                            break;
                        }
                        path = n + path;
                        k--;
                    }

                    // on to the next character
                    continue;

                }
                else if (c === '}') {

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
                    value += c;
                    continue;
                }

                // if not in expression
                // check if goes up a level
                if (c === '(') {

                    // create new empty array in target
                    target.push([]);

                    // remember current target (is parent)
                    parents.push(target);

                    // set new child slot as new target
                    target = target[target.length-1];

                }

                // find out if next set of characters is a logical operator
                if (c === ' ' || i===0 || c === '(') {

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

                // expression or level finished, time to clean up
                if (c === ')' || i === l-1) {

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

            path = 'tests/' + path;

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
     * @param {TestBase} test
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
    /**
     * @namespace ModuleRegister
     */
    var ModuleRegister = {

        _modules:{},

        /**
         * Register a module
         * @param {String} path - path to module
         * @param {Object} config - configuration to setup for module
         * @param {String} alias - alias name for module
         * @static
         */
        registerModule:function(path,config,alias) {

            var key=alias||path,map,conf;

            // setup module entry
            this._modules[key] = {};

            // check if has config defined
            if (config) {

                // set config entry
                this._modules[key].config = config;

                // update requirejs
                conf = {};
                conf[path] = config;
                requirejs.config({
                    config:conf
                });

            }

            // check if has alias defined
            if (alias) {

                // set alias entry
                this._modules[key].alias = alias;

                // update requirejs config
                map = {};
                map[alias] = path;
                requirejs.config({
                    map:{
                        '*':map
                    }
                });
            }
        },

        /**
         * Get a registered module by path
         * @param {String} path - path to module
         * @return {Object} - module specification object
         * @static
         */
        getModuleByPath:function(path) {

            // if no id supplied throw error
            if (!path) {
                throw new Error('ModuleRegister.getModuleById(path): "path" is a required parameter.');
            }

            return this._modules[path];

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
     * @param {Object} options - options for this ModuleController
     */
    var ModuleController = function(path,element,options) {

        // if no path supplied, throw error
        if (!path || !element) {
            throw new Error('ModuleController(path,element,options): "path" and "element" are required parameters.');
        }

        // path to module
        this._path = path;

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
        Observer.subscribe(this._conditionsManager,'ready',this._onReady.bind(this));

        // by default module is not ready and not available unless it's not conditioned or conditions are already suitable
        this._ready = !this.isConditioned() || this._conditionsManager.getSuitability();
        this._available = false;

    };

    ModuleController.prototype = {

        /**
         * Returns true if the module is available for initialisation, this is true when conditions have been met
         * @return {Boolean}
         * @public
         */
        isAvailable:function() {

            // remember
            this._available = this._conditionsManager.getSuitability();

            // return
            return this._available;
        },

        /**
         * Returns true if module is currently active and loaded
         * @returns {Boolean}
         * @public
         */
        isActive:function() {
            return this._module !== null;
        },

        /**
         * Returns true if the module is dependent on certain conditions
         * @return {Boolean}
         * @public
         */
        isConditioned:function() {
            return typeof this._options.conditions !== 'undefined';
        },

        /**
         * Returns true if the module is ready, this is true when conditions have been read for the first time
         * @return {Boolean}
         * @public
         */
        isReady:function() {
            return this._ready;
        },

        /**
         * Checks if the module matches the path
         * @param {String} path - path of module to test for
         * @return {Boolean} if matched
         * @public
         */
        matchesPath:function(path) {
            return this._path === path;
        },

        /**
         * @private
         * @fires ready
         */
        _onReady:function(suitable) {

            // module is now ready (this does not mean it's available)
            this._ready = true;

            // listen to changes in conditions
            Observer.subscribe(this._conditionsManager,'change',this._onConditionsChange.bind(this));

            // let others know we are ready
            Observer.publish(this,'ready');

            // are we available
            if (suitable) {
                this._onAvailable();
            }

        },

        /**
         * @private
         * @fires available
         */
        _onAvailable:function() {

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
                this._onAvailable();
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
            require([this._path],function(Module){

                // set reference to Module
                self._Module = Module;

                // module is now ready to be loaded
                self._onLoad();

            });

        },

        /**
         * Method called when module loaded
         * @fires load
         * @private
         */
        _onLoad:function() {

            // if no longer available for loading stop here
            if (!this.isAvailable()) {
                return;
            }

            // get module specification
            var specification = ModuleRegister.getModuleByPath(this._path),
                globalOptions = specification ? specification.config : {},
                elementOptions = {},
                options;

            // parse element options
            if (typeof this._options.options === 'string') {
                try {
                    elementOptions = JSON.parse(this._options.options);
                }
                catch(e) {
                    throw new Error('ModuleController.load(): "options" is not a valid JSON string.');
                }
            }
            else {
                elementOptions = this._options.options;
            }

            // merge module global options with element options if found
            options = globalOptions ? Utils.mergeObjects(globalOptions,elementOptions) : elementOptions;

            // merge module default options with result of previous merge
            options = this._Module.options ? Utils.mergeObjects(this._Module.options,options) : options;

            // set reference
            if (typeof this._Module === 'function') {

                // is of function type so try to create instance
                this._module = new this._Module(this._element,options);
            }
            else {

                // is of other type so expect load method to be defined
                this._module = this._Module.load ? this._Module.load(this._element,options) : null;
            }

            // if no module defined throw error
            if (!this._module) {
                throw new Error('ModuleController.load(): could not initialize module, missing constructor or "load" method.');
            }

            // set initialized attribute to initialized module
            this._element.setAttribute('data-initialized',this._path);

            // propagate events from actual module to module controller
            // this way it is possible to listen to events on the controller which is always there
            Observer.setupPropagationTarget(this._module,this);

            // publish load event
            Observer.publish(this,'load',this);

        },

        /**
         * Unloads the module
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

            // clean propagation target
            Observer.removePropagationTarget(this._module,this);

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
         * Executes a methods on the loaded module
         * @param {String} method - method key
         * @param {Array} params - optional array containing the method parameters
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

            // once loaded call method and pass parameters
            return {
                'status':200,
                'response':F.apply(this._module,params)
            };

        }

    };
    /**
     * @exports Node
     * @class
     * @constructor
     * @param {Element} element
     */
    var Node = function(element) {

        if (!element) {
            throw new Error('Node: "element" is a required parameter.');
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
    Node.hasProcessed = function(element) {
        return element.getAttribute('data-processed') === 'true';
    };

    Node.prototype = {

        /**
         * Initializes the node
         * @public
         */
        init:function() {

            // parse element module attributes
            this._moduleControllers = this._createModuleControllers();

            // initialize
            var i=0,l=this._moduleControllers.length,mc;

            // if no module controllers found
            if (!l) {
                throw new Error('Node: "element" has to have a "data-module" attribute containing a reference to a Module.');
            }

            // listen to ready events on module controllers
            for (;i<l;i++) {

                mc = this._moduleControllers[i];

                // if module already ready, jump to _onModuleReady method and don't bind listener
                if (mc.isReady()) {
                    this._onModuleReady();
                    continue;
                }

                // otherwise, listen to ready event
                Observer.subscribe(mc,'ready',this._onModuleReady.bind(this));
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
         * Public method to check if the module matches the given query
         * @param {String} selector
         * @return {Boolean}
         * @public
         */
        matchesSelector:function(selector) {
            return Utils.matchesSelector(this._element,selector);
        },

        /**
         * Returns a reference to the currently active module controller
         * @return {ModuleController}
         * @public
         */
        getActiveModuleController:function() {
            return this._activeModuleController;
        },

        /**
         * Returns the first ModuleController matching the given path
         * @param path {String} path to module
         * @return {ModuleController}
         * @public
         */
        getModuleController:function(path) {
            return this.getModuleControllerAll(path)[0];
        },

        /**
         * Returns an array of ModuleControllers matching the given path
         * @param path {String} path to module
         * @return {Array}
         * @public
         */
        getModuleControllerAll:function(path) {

            if (typeof path === 'undefined') {
                return this._moduleControllers.concat();
            }

            var i=0,l=this._moduleControllers.length,result=[],mc;
            for (;i<l;i++) {
                mc = this._moduleControllers[i];
                if (mc.matchesPath(path)) {
                    result.push(mc);
                }
            }
            return result;
        },

        /**
         * Public method for safely executing methods on the loaded module
         * @param {String} method - method key
         * @param {Array} params - array containing the method parameters
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
         * Called when a module has indicated it is ready
         * @private
         */
        _onModuleReady:function() {

            var i=this._moduleControllers.length;

            // check if all modules ready, if so, call on modules ready
            while (--i >= 0) {
                if (!this._moduleControllers[i].isReady()) {
                    return;
                }
            }

            // all modules ready
            this._onModulesReady();

        },

        /**
         * Called when all modules are ready
         * @private
         */
        _onModulesReady:function() {

            // find suitable active module controller
            var moduleController = this._getSuitableActiveModuleController();
            if (moduleController) {
                this._setActiveModuleController(moduleController);
            }

            // listen to available events on controllers
            var i=0,l=this._moduleControllers.length;
            for (;i<l;i++) {
                Observer.subscribe(this._moduleControllers[i],'available',this._onModuleAvailable.bind(this));
            }

        },

        /**
         * Called when a module controller has indicated it is ready to be loaded
         * @param moduleController
         * @private
         */
        _onModuleAvailable:function(moduleController) {

            // setup vars
            var i=0,l=this._moduleControllers.length,mc;

            for (;i<l;i++) {

                mc = this._moduleControllers[i];

                if (mc !== moduleController &&
                    mc.isAvailable() &&
                    mc.isConditioned()) {

                    // earlier or conditioned module is ready, therefor cannot load this module

                    return;
                }
            }

            // load supplied module controller as active module
            this._setActiveModuleController(moduleController);

        },

        /**
         * Sets the active module controller
         * @param moduleController
         * @private
         */
        _setActiveModuleController:function(moduleController) {

            // if not already loaded
            if (moduleController === this._activeModuleController) {
                return;
            }

            // clean up active module controller reference
            this._cleanActiveModuleController();

            // set new active module controller
            this._activeModuleController = moduleController;
            Observer.subscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);
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
            var moduleController = this._getSuitableActiveModuleController();
            if(!moduleController) {
                return;
            }

            // set found module controller as new active module controller
            this._setActiveModuleController(moduleController);
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
                if (!mc.isAvailable()) {
                    continue;
                }

                return mc;
            }

            return null;
        },

        /**
         * Returns an array of module controllers found specified on the element
         * @returns {Array}
         * @private
         */
        _createModuleControllers:function() {

            var result = [],
                config = this._element.getAttribute('data-module') || '',
                advanced = config.charAt(0) === '[';

            if (advanced) {

                var specs;

                // add multiple module controllers
                try {
                    specs = JSON.parse(config);
                }
                catch(e) {
                    // failed parsing spec
                    throw new Error('Node: "data-module" attribute containing a malformed JSON string.');
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

                    result.push(
                        new ModuleController(spec.path,this._element,{
                            'conditions':spec.conditions,
                            'options':spec.options
                        })
                    );

                }


            }
            else if (config.length) {

                // add default module controller
                result.push(
                    new ModuleController(config,this._element,{
                        'conditions':this._element.getAttribute('data-conditions'),
                        'options':this._element.getAttribute('data-options')
                    })
                );

            }

            return result;

        }

    };
    /**
     * @exports Conditioner
     * @class
     * @constructor
     */
    var Conditioner = function() {

        // options for conditioner
        this._options = {
            'modules':{}
        };

        // array of all parsed nodes
        this._nodes = [];

        /**
         * Reference to Observer object
         * @property {Observer}
         */
        this.Observer = Observer;

        /**
         * Reference to mergeObject method
         * @property {Function} mergeObjects
         */
        this.mergeObjects = Utils.mergeObjects;
    };

    Conditioner.prototype = {

        /**
         * Set custom options
         * @param {Object} options - options to override
         * @public
         */
        setOptions:function(options) {

            if (!options) {
                throw new Error('Conditioner.setOptions(options): "options" is a required parameter.');
            }

            // update options
            this._options = Utils.mergeObjects(this._options,options);

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
                ModuleRegister.registerModule(path,config,alias);

            }
        },

        /**
         * Loads modules within the given context
         * @param {Element} context - Context to find modules in
         * @return {Array} - Array of found Nodes
         */
        loadModules:function(context) {

            // if no context supplied throw error
            if (!context) {
                throw new Error('Conditioner.loadModules(context): "context" is a required parameter.');
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
                if (Node.hasProcessed(element)) {
                    continue;
                }

                // create new node
                nodes.push(new Node(element));
            }

            // sort nodes by priority:
            // higher numbers go first,
            // then 0 (or no priority assigned),
            // then negative numbers
            // - (it's actually the other way around but that's because of the reversed while loop)
            nodes.sort(function(a,b){
                return a.getPriority() - b.getPriority();
            });

            // initialize modules depending on assigned priority (in reverse, but priority is reversed as well so all is okay)
            i = nodes.length;
            while (--i >= 0) {
                nodes[i].init();
            }

            // merge new nodes with currently active nodes list
            this._nodes = this._nodes.concat(nodes);

            // returns nodes so it is possible to later unload nodes manually if necessary
            return nodes;
        },

        /**
         * Returns the first Node matching the selector
         * @param {String} selector - Selector to match the nodes to
         * @return {Node} First matched node
         */
        getNode:function(selector) {
            return this.getNodesAll(selector)[0];
        },

        /**
         * Returns all nodes matching the selector
         * @param {String} selector - Optional selector to match the nodes to
         * @return {Array} Array containing matched nodes
         */
        getNodesAll:function(selector) {

            // if no query supplied return all nodes
            if (typeof selector === 'undefined') {
                return this._nodes.concat();
            }

            // find matches
            var i=0,l = this._nodes.length,results=[],node;
            for (;i<l;i++) {
                node = this._nodes[i];
                if (node.matchesSelector(selector)) {
                    results.push(node);
                }
            }

            return results;
        }

    };

    return new Conditioner();

});