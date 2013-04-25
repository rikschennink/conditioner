// conditioner v0.8.1 - A JavaScript framework for conditionally loading UI classes
// Copyright (c) 2013 Rik Schennink - https://github.com/rikschennink/conditioner
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

define(['require'],function(require){

/**
 * @module Conditioner
 */

'use strict';

// based on https://github.com/nrf110/deepmerge/blob/master/index.js
function mergeObjects(target, src) {

    var array = Array.isArray(src);
    var dst = array && [] || {};

    src = src || {};

    if (array) {

        target = target || [];
        dst = dst.concat(target);

        src.forEach(function(e, i) {

            if (typeof e === 'object') {
                dst[i] = mergeObjects(target[i], e);
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
                    dst[key] = mergeObjects(target[key], src[key]);
                }
            }

        });
    }

    return dst;
}

/**
 * @method matchesSelector
 */
var matchesSelector = (function() {

    var _method = null;
    var el = document.body;
    if (el.matches) {
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

    return function(element,selector) {

        if (!element) {
            return false;
        }

        return element[_method](selector);

    };

}());


/**
 * @class Observer
 */
var Observer = (function(){

    return {

        /**
         * Subscribe to an event
         * @method subscribe
         * @param {object} obj - Object to subscribe to
         * @param {string} type - Event type to listen for
         * @param {Function} fn - Function to call when event fires
         */
        subscribe:function(obj,type,fn) {

            if (!obj._subscriptions) {
                obj._subscriptions = [];
            }

            // check if already added
            var test,i=0,l = obj._subscriptions;
            for (; i<l; i++) {
                test = obj._subscriptions[i];
                if (test.type == type && test.fn == fn) {
                    return;
                }
            }

            // add event
            obj._subscriptions.push({'type':type,'fn':fn});
        },

        /**
         * Unsubscribe from further notifications
         * @method unsubscribe
         * @param {object} obj - Object to unsubscribe from
         * @param {string} type - Event type to match
         * @param {Function} fn - Function to match
         */
        unsubscribe:function(obj,type,fn) {

            if (!obj._subscriptions) {
                return;
            }

            // find and remove
            var test,i;
            for (i = obj._subscriptions.length-1; i >= 0; i--) {
                test = obj._subscriptions[i];
                if (test.type == type && test.fn == fn) {
                    obj._subscriptions.splice(i,1);
                    break;
                }
            }
        },

        /**
         * Publish an event
         * @method publish
         * @param {object} obj - Object to fire the event on
         * @param {string} type - Event type to fire
         * @param {object} data - Any type of data
         */
        publish:function(obj,type,data) {

            if (!obj._subscriptions) {
                obj._subscriptions = [];
            }
            
            // find and execute callback
            var subscriptions=[],subscription,i=0,l = obj._subscriptions.length;
            for (;i<l; i++) {
                subscription = obj._subscriptions[i];
                if (subscription.type == type) {
                    subscriptions.push(subscription);
                }
            }

            // call callbacks
            l = subscriptions.length;
            for (i=0;i<l;i++) {
                subscriptions[i].fn(data)
            }

            // see if should be propagated
            if (obj._eventPropagationTarget) {
                this.publish(obj._eventPropagationTarget,type,data);
            }

        },

        /**
         * Setup propagation target for events so they can bubble up the object tree
         * @method setupPropagationTarget
         * @param {object} obj - Object to set as origin
         * @param {object} target - Object to set as target
         */
        setupPropagationTarget:function(obj,target) {
            if (!obj) {
                return;
            }
            obj._eventPropagationTarget = target;
        },

        removePropagationTarget:function(obj,target) {
            if (!obj) {
                return;
            }
            obj._eventPropagationTarget = null;
        }

    };

}());


/**
 * @class Module
 */
var Module = (function(mergeObjects) {

    /**
     * @constructor
     * @param {Element} element - DOM Element to apply this behavior to
     * @param {object} [options] - Custom options to pass to this behavior
     */
    var Module = function(element,options) {

        // if no element, throw error
        if (!element) {
            throw new Error('BehaviorBase(element,options): "element" is a required parameter.');
        }

        // element reference
        this._element = element;
        this._element.setAttribute('data-initialized','true');

        // declare options as empty
        this._options = this._options || {};
        this._options = options ? mergeObjects(this._options,options) : this._options;

    };


    /**
     * Unloads behaviour by removing data initialized property
     * Override to clean up your control, remove event listeners, restore original state, etc.
     * @method _unload
     */
    Module.prototype._unload = function() {
        this._element.removeAttribute('data-initialized');
    };

    return Module;

}(mergeObjects));


/**
 * @class Test
 */
var Test = (function(Observer){

    /**
     * @constructor
     * @param {object} expected - expected conditions to be met
     * @param {Element} [element] - optional element to measure these conditions on
     */
    var Test = function(expected,element) {

        // store expected value
        this._expected = expected;

        // store element
        this._element = element;

        // set default state
        this._state = true;

    };

    Test.inherit = function() {
        var T = function(expected,element) {
            Test.call(this,expected,element);
        };
        T.prototype = Object.create(Test.prototype);
        return T;
    };

    var p = Test.prototype;

    p._test = function(expected) {

        // override in subclass

    };

    p.arrange = function() {

        // override in subclass

    };

    p.assert = function() {

        // call test
        var state = this._test(this._expected);

        // check if result changed
        if (this._state !== state) {
            this._state = state;
            Observer.publish(this,'change',state);
        }

    };

    p.succeeds = function() {
        return this._state;
    };

    return Test;

}(Observer));


/**
 * @class ModuleRegister
 */
var ModuleRegister = {

    _modules:{},

    /**
     * Register a module
     * @method registerModule
     * @param {string} path - path to module
     * @param {object} config - configuration to setupe for module
     * @param {string} alias - alias name for module
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

            // update requirejs
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
     * @method getModuleByPath
     * @param {string} path - path to module
     * @return {object} - module specification object
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
 * @class ConditionsManager
 */
var ConditionsManager = (function(require){





    // helper method
    var makeImplicit = function(level) {

        var i=0,l=level.length;

        for (;i<l;i++) {

            if (l>3) {

                // binary expression found merge into new level
                level.splice(i,3,level.slice(i,i+3));

                // set new length
                l = level.length;

                // move back to start
                i=-1;

            }
            else if (typeof level[i] !== 'string') {

                // level okay, check lower level
                makeImplicit(level[i]);

            }

        }

    };

    // helper method
    var parseCondition = function(condition) {

        var i=0,
            c,
            k,
            n,
            operator,
            path = '',
            tree = [],
            value = '',
            isValue = false,
            target = null,
            flattened = null,
            parent = null,
            parents = [],
            l=condition.length;


        if (!target) {
            target = tree;
        }

        // read explicit expressions
        for (;i<l;i++) {

            c = condition.charAt(i);

            // check if an expression
            if (c === '{') {

                // now reading the expression
                isValue = true;

                // reset name var
                path = '';

                // fetch name
                k = i-2;
                while(k>=0) {
                    n = condition.charAt(k);
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

                // add value and
                target.push({'path':path,'value':value});

                // reset vars
                path = '';
                value = '';

                // no longer a value
                isValue = false;

                // on to the next character
                continue;
            }

            // if we are reading an expression add characters to expression
            if (isValue) {
                value += c;
                continue;
            }

            // if not in expression
            if (c === ' ') {

                // get operator
                operator = condition.substr(i,4).match(/and|or/g);

                // if operator found
                if (operator) {

                    // add operator
                    target.push(operator[0]);

                    // skip over operator
                    i+=operator[0].length+1;
                }

                continue;
            }

            // check if goes up a level
            if (c === '(') {

                // create new empty array in target
                target.push([]);

                // remember current target (is parent)
                parents.push(target);

                // set new child slot as new target
                target = target[target.length-1];

            }
            else if (c === ')' || i === l-1) {

                // reset flattened data
                flattened = null;

                // get parent
                parent = parents.pop();

                // if only contains single element flatten array
                if (target.length === 1 || (parent && parent.length===1 && i===l-1)) {
                    flattened = target.concat();
                }

                // restore parent
                target = parent;

                // if data defined
                if (flattened && target) {

                    target.pop();

                    for (k=0;k<flattened.length;k++) {
                        target.push(flattened[k]);
                    }

                }

            }
        }

        // derive implicit expressions
        makeImplicit(tree);

        // return final expression tree
        return tree.length === 1 ? tree[0] : tree;
    };


    // ExpressionBase
    var ExpressionBase = {
        succeeds:function() {
            // override in subclass
        }
    };


    // UnaryExpression
    var UnaryExpression = function(test) {
        this._test = test;
    };
    UnaryExpression.prototype = Object.create(ExpressionBase);
    UnaryExpression.prototype.setTest = function(test) {
        this._test = test;
    };
    UnaryExpression.prototype.succeeds = function() {
        return this._test.succeeds();
    };


    //BinaryExpression
    var BinaryExpression = function(a,o,b) {
        this._a = a;
        this._o = o;
        this._b = b;
    };
    BinaryExpression.prototype = Object.create(ExpressionBase);
    BinaryExpression.prototype.succeeds = function() {

        return this._o==='and' ?

        // is 'and' operator
        this._a.succeeds() && this._b.succeeds() :

        // is 'or' operator
        this._a.succeeds() || this._b.succeeds();

    };




    /**
     * @constructor
     * @param {string} conditions - conditions to be met
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

        // load tests
        this._tests = [];

        // change event bind
        this._onResultsChangedBind = this._onTestResultsChanged.bind(this);

        // read test count
        this._count = conditions.match(/(\:\{)/g).length;

        // derive plain expression
        var expression = parseCondition(conditions);

        // load to expression tree
        this._expression = this._loadExpression(expression);

    };



    // prototype shortcut
    ConditionsManager.prototype = {

        /**
         * Returns true if the current conditions are suitable
         * @method getSuitability
         */
        getSuitability:function() {
            return this._suitable;
        },


        /**
         * Loads expression
         * @method _loadExpression
         */
        _loadExpression:function(expression) {

            // if expression is array
            if (expression.length === 3) {

                // is binary expression, create test
                return new BinaryExpression(
                    this._loadExpression(expression[0]),
                    expression[1],
                    this._loadExpression(expression[2])
                );

            }
            else {
                return this._createUnaryExpressionFromTest(expression);
            }

        },


        /**
         * Called to create a unary expression
         * @method _createUnaryExpressionFromTest
         * @param {Object} test
         * @return {UnaryExpression}
         */
        _createUnaryExpressionFromTest:function(test) {

            var unaryExpression = new UnaryExpression(null);
            var instance = null;
            var self = this;

            require(['tests/' + test.path],function(Test){

                // create test instance
                instance = new Test(test.value,self._element);

                // add instance to test set
                self._tests.push(instance);

                // set test to unary expression
                unaryExpression.setTest(instance);

                // lower test count
                self._count--;
                if (self._count===0) {
                    self._onReady();
                }
            });

            return unaryExpression;
        },


        /**
         * Called when all tests are ready
         * @method _onReady
         */
        _onReady:function() {

            // setup
            var l = this._tests.length,test,i;
            for (i=0;i<l;i++) {

                test = this._tests[i];

                // arrange test
                test.arrange();

                // execute test
                test.assert();

                // listen to changes
                Observer.subscribe(test,'change',this._onResultsChangedBind);
            }

            // test current state
            this.test();

            // we are now ready to start testing
            Observer.publish(this,'ready',this._suitable);

        },


        /**
         * Called when a condition has changed
         * @method _onConditionsChanged
         */
        _onTestResultsChanged:function() {
            this.test();
        },


        /**
         * Tests if conditions are suitable
         * @method test
         */
        test:function() {

            // test expression success state
            var suitable = this._expression.succeeds();

            // fire changed event if environment suitability changed
            if (suitable != this._suitable) {
                this._suitable = suitable;
                Observer.publish(this,'change');
            }

        }

    };

    return ConditionsManager;

}(require));


/**
 * @class ModuleController
 */
var ModuleController = (function(require,ModuleRegister,ConditionsManager,matchesSelector,mergeObjects){

    /**
     * @constructor
     * @param {string} path - reference to module
     * @param {object} options - options for this behavior controller
     */
    var ModuleController = function(path,options) {
        
        // if no element, throw error
        if (!path) {
            throw new Error('ModuleController(path,options): "path" is a required parameter.');
        }

        // options for class behavior controller should load
        this._path = path;

        // options for behavior controller
        this._options = options || {};

        // module reference
        this._Module = null;
        
        // module instance reference
        this._moduleInstance = null;

        // check if conditions specified
        this._conditionManager = new ConditionsManager(
            this._options.conditions,
            this._options.target
        );

        // listen to ready event on condition manager
        Observer.subscribe(this._conditionManager,'ready',this._onReady.bind(this));

        // by default module is not ready and not available unless it's not conditioned or conditions are already suitable
        this._ready = !this.isConditioned() || this._conditionManager.getSuitability();
        this._available = false;


    };


    // prototype shortcut
    var p = ModuleController.prototype;


    /**
     * Returns true if the module is ready to be initialized
     * @method isAvailable
     */
    p.isAvailable = function() {
        this._available = this._conditionManager.getSuitability();
        return this._available;
    };


    /**
     * Returns true if the module has no conditions defined
     * @method isReady
     */
    p.isConditioned = function() {
        return typeof this._options.conditions !== 'undefined';
    };


    p.isReady = function() {
        return this._ready;
    };

    p._onReady = function(suitable) {

        // module is now ready (this does not mean it's available)
        this._ready = true;

        // listen to changes in conditions
        Observer.subscribe(this._conditionManager,'change',this._onConditionsChange.bind(this));

        // let others know we are ready
        Observer.publish(this,'ready');

        // are we available
        if (suitable) {
            this._onAvailable();
        }
    };

    p._onAvailable = function() {

        // module is now available
        this._available = true;

        // let other know we are available
        Observer.publish(this,'available',this);

    };


    /**
     * Called when the conditions change.
     * @method _onConditionsChange
     */
    p._onConditionsChange = function() {
        
        var suitable = this._conditionManager.getSuitability();
        
        if (this._moduleInstance && !suitable) {
            this.unload();
        }
        
        if (!this._moduleInstance && suitable) {
            this._onAvailable();
        }
        
    };




    /**
     * Load the module set in the referenced in the path property
     * @method load
     */
    p.load = function() {

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

    };

    /**
     * Public method for loading the module
     * @method _onLoad
     */
    p._onLoad = function() {
        
        // if no longer available
        if (!this.isAvailable()) {
            return;
        }

        // get module specification
        var specification = ModuleRegister.getModuleByPath(this._path),
            moduleOptions = specification ? specification.config : {},
            elementOptions = {},
            options;

        // parse element options
        if (typeof this._options.options == 'string') {
            try {
                elementOptions = JSON.parse(this._options.options);
            }
            catch(e) {
                throw new Error('ModuleController.loadModule(): "options" is not a valid JSON string.');
            }
        }
        else {
            elementOptions = this._options.options;
        }

        // merge module default options with element options if found
        options = moduleOptions ? mergeObjects(moduleOptions,elementOptions) : elementOptions;

        // create instance
        this._moduleInstance = new this._Module(this._options.target,options);

        // propagate events from actual module to module controller
        // this way it is possible to listen to events on the controller which is always there
        Observer.setupPropagationTarget(this._moduleInstance,this);

        // publish load event
        Observer.publish(this,'load',this);
        
    };


    /**
     * Public method for unloading the module
     * @method unload
     * @return {boolean}
     */
    p.unload = function() {

        // module is now no longer ready to be loaded
        this._available = false;

        // if no module, module has already been unloaded or was never loaded
        if (!this._moduleInstance) {
            return false;
        }

        // clean propagation target
        Observer.removePropagationTarget(this._moduleInstance,this);

        // unload behavior if possible
        if (this._moduleInstance._unload) {
            this._moduleInstance._unload();
        }

        // reset property
        this._moduleInstance = null;

        // publish unload event
        Observer.publish(this,'unload',this);

        return true;
    };


    /**
     * Public method to check if the module matches the given query
     * @method matchesQuery
     * @param {object || string} query - string query to match or object to match
     * @return {boolean} if matched
     */
    p.matchesQuery = function(query) {

        if (typeof query == 'string') {

            // check if matches query
            if (matchesSelector(this._options.target,query)) {
                return true;
            }
            
        }

        return (query == this._options.target);
    };



    /**
     * Public method for safely executing methods on the loaded module
     * @method execute
     * @param {string} method - method key
     * @param {Array} [params] - array containing the method parameters
     * @return
     */
    p.execute = function(method,params) {

        // if behavior not loaded
        if (!this._moduleInstance) {
            return null;
        }

        // get function reference
        var F = this._moduleInstance[method];
        if (!F) {
            throw new Error('ModuleController.execute(method,params): function specified in "method" not found on module.');
        }

        // once loaded call method and pass parameters
        return F.apply(this._moduleInstance,params);

    };

    return ModuleController;

}(require,ModuleRegister,ConditionsManager,matchesSelector,mergeObjects));


/**
 * @class Node
 */
var Node = (function(Observer){


    /**
     * @constructor
     * @param {Element} element
     */
    var Node = function(element) {

        // set element reference
        this._element = element;

        // has been processed
        this._element.setAttribute('data-processed','true');

        // set priority
        this._priority = this._element.getAttribute('data-priority');

        // contains references to all module controllers
        this._moduleControllers = [];

        // contains reference to currently active module controller
        this._activeModuleController = null;

        // method to unbind
        this._activeModuleUnloadBind = this._onActiveModuleUnload.bind(this);
        
    };

    var p = Node.prototype;


    /**
     * Static method testing if the current element has been processed already
     * @method getPriority
     */
    Node.hasProcessed = function(element) {
        return element.getAttribute('data-processed') === 'true';
    };


    /**
     * Returns the set priority for this node
     * @method getPriority
     */
    p.getPriority = function() {
        return this._priority;
    };


    /**
     * Initializes the node
     * @method init
     */
    p.init = function() {

        // parse element module attributes
        this._moduleControllers = this._getModuleControllers();

        // listen to ready events on module controllers
        var l=this._moduleControllers.length,i,mc;

        // initialize modules
        for (i=0;i<l;i++) {

            mc = this._moduleControllers[i];

            // if module already ready, check if all modules loaded now
            if (mc.isReady()) {
                this._onModuleReady();
                continue;
            }

            // otherwise, listen to ready event
            Observer.subscribe(mc,'ready',this._onModuleReady.bind(this));

        }

    };

    p._onModuleReady = function() {

        // check if all modules ready, if so, call on modules ready
        var i=0,l=this._moduleControllers.length;

        for (;i<l;i++) {
            if (!this._moduleControllers[i].isReady()) {
                return;
            }
        }

        // all modules ready
        this._onModulesReady();

    };

    p._onModulesReady = function() {

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

    };


    /**
     * Called when a module controller has indicated it is ready to be loaded
     * @method _onModuleReady
     */
    p._onModuleAvailable = function(moduleController) {

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

    };

    p._setActiveModuleController = function(moduleController) {

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

    };

    p._cleanActiveModuleController = function() {

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
    };

    p._onActiveModuleUnload = function() {

        // clean up active module controller reference
        this._cleanActiveModuleController();

        // active module was unloaded, find another active module
        var moduleController = this._getSuitableActiveModuleController();
        if(!moduleController) {
            return;
        }

        // set found module controller as new active module controller
        this._setActiveModuleController(moduleController);
    };

    p._getSuitableActiveModuleController = function() {

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
    };


    /**
     * Returns an array of module controllers found specified on the element
     * @method _getModuleControllers
     */
    p._getModuleControllers = function() {

        var result = [];
        var config = this._element.getAttribute('data-module');
        var advanced = config.charAt(0) == '[';

        if (advanced) {

            var specs;

            // add multiple module controllers
            try {
                specs = JSON.parse(config);
            }
            catch(e) {
                // failed parsing spec
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
                    new ModuleController(spec.path,{
                        'conditions':spec.conditions,
                        'options':spec.options,
                        'target':this._element
                    })
                );

            }


        }
        else {

            // add default module controller
            result.push(
                new ModuleController(config,{
                    'conditions':this._element.getAttribute('data-conditions'),
                    'options':this._element.getAttribute('data-options'),
                    'target':this._element
                })
            );

        }

        return result;

    };


    /**
     * Public method to check if the module matches the given query
     * @method matchesQuery
     * @param {object || string} query - string query to match or object to match
     * @return {boolean} if matched
     */
    p.matchesQuery = function(query) {

        return null; // todo: link to controller

    };


    /**
     * Public method for safely executing methods on the loaded module
     * @method execute
     * @param {string} method - method key
     * @param {Array} [params] - array containing the method parameters
     * @return
     */
    p.execute = function(method,params) {

        return null; // todo: link to controller

    };

    return Node;
    
}(Observer));


/**
 * @class Conditioner
 */
var Conditioner = (function(ModuleRegister,ModuleController,Node,Test,Module,Observer,mergeObjects){


    /**
     * @constructor
     */
    var Conditioner = function() {

        // options for conditioner
        this._options = {
            'attribute':{
                'module':'data-module',
                'conditions':'data-conditions',
                'options':'data-options',
                'priority':'data-priority'
            },
            'modules':{}
        };

        // array of all parsed nodes
        this._nodes = [];

    };

    // prototype shortcut
    var p = Conditioner.prototype;


    /**
     * @method setOptions, set custom options
     * @param {object} options - options to override
     */
    p.setOptions = function(options) {

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
            ModuleRegister.registerModule(path,config,alias);

        }


    };


    /**
     * Loads modules within the given context.
     *
     * @method loadModules
     * @param {Element} context - Context to find modules in
     * @return {Array} - Array of initialized ModuleControllers
     */
    p.loadModules = function(context) {

        // if no context supplied throw error
        if (!context) {
            throw new Error('Conditioner.loadModules(context): "context" is a required parameter.');
        }

        // register vars and get elements
        var elements = context.querySelectorAll('[' + this._options.attribute.module + ']'),
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
        nodes.sort(function(a,b){
            return b.getPriority() - a.getPriority();
        });

        // initialize modules depending on assigned priority
        l = nodes.length;
        for (i=0; i<l; i++) {
            nodes[i].init();
        }

        // merge new nodes with currently active nodes list
        this._nodes = this._nodes.concat(nodes);

        // returns nodes so it is possible to later unload nodes manually if necessary
        return nodes;
    };


    /**
     * Returns ModuleControllers matching the selector
     *
     * @method getModule
     * @param {object} query - Query to match the ModuleController to, could be ClassPath, Element or CSS Selector
     * @return {object} controller - First matched ModuleController
     */
    p.getModule = function(query) {
        var i=0,l = this._nodes.length,node;
        for (;i<l;i++) {
            node = this._nodes[i];
            if (node.matchesQuery(query)) {
                return node;
            }
        }
        return null;
    };


    /**
     * Returns all ModuleControllers matching the selector
     *
     * @method getModuleAll
     * @param {object} query - Query to match the controller to, could be ClassPath, Element or CSS Selector
     * @return {Array} results - Array containing matched behavior controllers
     */
    p.getModuleAll = function(query) {
        if (typeof query == 'undefined') {
            return this._nodes.concat();
        }
        var i=0,l = this._node.length,results=[],node;
        for (;i<l;i++) {
            node = this._nodes[i];
            if (node.matchesQuery(query)) {
                results.push(node);
            }
        }
        return results;
    };


    // Singleton structure
    var _instance;

    return {

        /**
         * Returns an instance of the Conditioner
         * @method getInstance
         * @return instance of Conditioner
         */
        getInstance:function() {
            if (!_instance) {_instance = new Conditioner();}
            return _instance;
        },

        /**
         * Reference to Test base class
         */
        Test:Test,

        /**
         * Reference to Module base class
         */
        Module:Module,

        /**
         * Reference to Observer class
         */
        Observer:Observer,

        /**
         * Reference to updateObject method
         */
        mergeObjects:mergeObjects

    };

}(ModuleRegister,ModuleController,Node,Test,Module,Observer,mergeObjects));


// expose conditioner
return Conditioner;

});
