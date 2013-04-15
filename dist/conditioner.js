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
            var test,i=0,l = obj._subscriptions.length;
            for (; i<l; i++) {
                test = obj._subscriptions[i];
                if (test.type == type) {
                    test.fn(data);
                }
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

        // store element
        this._element = element;

        // set default state
        this._state = true;

        // rules to test
        this._rules = [];

        // transform expected object into separate rules
        if (expected instanceof Array || typeof expected != 'object') {
            this._addRule(expected);
        }
        else if (typeof expected == 'object') {
            for (var key in expected) {
                if (!expected.hasOwnProperty(key)){continue;}
                this._addRule(expected[key],key);
            }
        }

    };

    Test.inherit = function() {
        var T = function(expected,element) {
            Test.call(this,expected,element);
        };
        T.prototype = Object.create(Test.prototype);
        return T;
    };

    var p = Test.prototype;

    p._addRule = function(value,key) {

        if (!value) {
            throw new Error('TestBase._addRule(value,key): "value" is a required parameter.');
        }

        this._rules.push({
            'key':typeof key == 'undefined' ? 'default' : key,
            'value':value
        });

    };

    p._test = function(rule) {

        // override in subclass

    };

    p.arrange = function() {

        // override in subclass

    };

    p.assert = function() {

        var i=0,l=this._rules.length,result = true;
        for (;i<l;i++) {
            if (!this._test(this._rules[i])) {
                result = false;
                break;
            }
        }

        if (this._state!= result) {
            this._state = result;
            Observer.publish(this,'change',result);
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
 * @class ConditionManager
 */
var ConditionManager = (function(require){

    /**
     * @constructor
     * @param {object} expected - expected conditions to be met
     * @param {Element} [element] - optional element to measure these conditions on
     */
    var ConditionManager = function(expected,element) {

        // if the conditions are suitable, by default they are
        this._suitable = true;

        // if no conditions, conditions will always be suitable
        if (!expected) {
            return;
        }

        // conditions supplied, conditions are now unsuitable by default
        this._suitable = false;

        // if expected is in string format try to parse as JSON
        if (typeof expected == 'string') {
            try {
                expected = JSON.parse(expected);
            }
            catch(e) {
                console.warn('ConditionManager(expected,element): expected conditions should be in JSON format.');
                return;
            }
        }

        // event bind
        this._onResultsChangedBind = this._onTestResultsChanged.bind(this);

        // set properties
        this._tests = [];

        // set conditions array
        this._count = 0;

        // parse expected
        var key;
        for (key in expected) {

            // skip if not own property
            if (!expected.hasOwnProperty(key)) {continue;}

            // up count
            this._count++;

            // load test for expectation with supplied key
            this._loadTest(key,expected,element);

        }
    };



    // prototype shortcut
    ConditionManager.prototype = {


        /**
         * Called to load a test
         * @method _loadTest
         * @param {string} path - path to the test module
         * @param {object} expected - Expected value for this test
         * @param {node} [element] - Element related to this test
         */
        _loadTest:function(path,expected,element) {

            var self = this;

            require(['tests/' + path],function(Test){

                //condition = new Condition(
                var test = new Test(expected[path],element);

                // add to tests array
                self._tests.push(test);

                // another test loaded
                self._onLoadTest();

            });

        },


        /**
         * Called when a test was loaded
         * @method _onLoadTest
         */
        _onLoadTest:function() {

            // lower count if test loaded
            this._count--;

            // if count reaches zero all tests have been loaded
            if (this._count==0) {
                this._onReady();
            }

        },

        /**
         * Called when all tests are ready
         * @method _onReady
         */
        _onReady:function() {

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

            // check all conditions on suitability
            var suitable = true,l = this._tests.length,test,i;
            for (i=0;i<l;i++) {
                test = this._tests[i];
                if (!test.succeeds()) {
                    suitable = false;
                    break;
                }
            }

            // fire changed event if environment suitability changed
            if (suitable != this._suitable) {
                this._suitable = suitable;
                Observer.publish(this,'change');
            }

        },


        /**
         * Returns true if the current conditions are suitable
         * @method getSuitability
         */
        getSuitability:function() {
            return this._suitable;
        }
    };

    return ConditionManager;

}(require));


/**
 * @class ModuleController
 */
var ModuleController = (function(require,ModuleRegister,ConditionManager,matchesSelector,mergeObjects){

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
        this._options.suitable = typeof this._options.suitable === 'undefined' ? true : this._options.suitable;

        // module reference
        this._module = null;

    };


    // prototype shortcut
    var p = ModuleController.prototype;


    /**
     * Initializes the module controller
     * @method init
     */
    p.init = function() {

        // check if conditions specified
        this._conditionManager = new ConditionManager(
            this._options.conditions,
            this._options.target
        );

        // listen to changes in conditions
        Observer.subscribe(this._conditionManager,'change',this._onConditionsChange.bind(this));

        // if already suitable, load module
        if (this._conditionManager.getSuitability() === this._options.suitable) {
            this._loadModule();
        }

    };


    /**
     * Called when the conditions change.
     * @method _onConditionsChange
     */
    p._onConditionsChange = function() {

        var suitable = this._conditionManager.getSuitability();

        if (this._module && suitable !== this._options.suitable) {
            this.unloadModule();
        }

        if (!this._module && suitable === this._options.suitable) {
            this._loadModule();
        }

    };


    /**
     * Load the module set in the referenced in the path property
     * @method _loadModule
     */
    p._loadModule = function() {

        var self = this;

        require([this._path],function(klass){

            // get module specification
            var specification = ModuleRegister.getModuleByPath(self._path),
                moduleOptions = specification ? specification.config : {},
                elementOptions = {},
                options;

            // parse element options
            if (typeof self._options.options == 'string') {
                try {
                    elementOptions = JSON.parse(self._options.options);
                }
                catch(e) {}
            }
            else {
                elementOptions = self._options.options;
            }

            // merge options if necessary
            options = moduleOptions ? mergeObjects(moduleOptions,elementOptions) : elementOptions;

            // create instance of behavior klass
            self._module = new klass(self._options.target,options);

            // propagate events from behavior to behaviorController
            Observer.setupPropagationTarget(self._module,self);

        });

    };


    /**
     * Public method for unloading the module
     * @method unloadModule
     * @return {boolean}
     */
    p.unloadModule = function() {

        if (!this._module) {
            return false;
        }

        // unload behavior if possible
        if (this._module._unload) {
            this._module._unload();
        }

        // reset property
        this._module = null;

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
        if (!this._module) {
            return null;
        }

        // get function reference
        var F = this._module[method];
        if (!F) {
            throw new Error('Conditioner(method,params): "method" not found on module.');
        }

        // once loaded call method and pass parameters
        return F.apply(this._module,params);

    };

    return ModuleController;

}(require,ModuleRegister,ConditionManager,matchesSelector,mergeObjects));


/**
 * @class Conditioner
 */
var Conditioner = (function(ModuleRegister,ModuleController,mergeObjects,Test,Module,Observer){


    /**
     * @constructor
     */
    var Conditioner = function() {

        // options for conditioner
        this._options = {
            'attribute':{
                'module':'data-module',
                'alternative':'data-module-alt',
                'conditions':'data-conditions',
                'options':'data-options',
                'options-alt':'data-options-alt',
                'priority':'data-priority'
            },
            'modules':{}
        };

        // array of all active controllers
        this._controllers = [];

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
     * Applies behavior on object within given context.
     *
     * @method applyBehavior
     * @param {Element} context - Context to apply behavior to
     * @return {Array} - Array of initialized ModuleControllers
     */
    p.applyBehavior = function(context) {

        // if no context supplied throw error
        if (!context) {
            throw new Error('Conditioner.applyBehavior(context,options): "context" is a required parameter.');
        }

        // register vars and get elements
        var elements = context.querySelectorAll('[' + this._options.attribute.module + ']'),
            i = 0,
            l = elements.length,
            controllers = [],
            priorityList = [],
            controller,
            element,
            specs,
            spec;

        // if no elements do nothing
        if (!elements) {
            return [];
        }

        // process elements
        for (; i<l; i++) {

            // set element reference
            element = elements[i];

            // skip element if already processed
            if (element.getAttribute('data-processed') == 'true') {
                continue;
            }

            // has been processed
            element.setAttribute('data-processed','true');

            // get specs
            specs = this._getModuleSpecificationsByElement(element);

            // apply specs
            while (spec = specs.shift()) {

                // create controller instance
                controller = new ModuleController(
                    spec.path,
                    {
                        'target':element,
                        'conditions':spec.conditions,
                        'options':spec.options,
                        'suitable':spec.suitable
                    }
                );

                // add to priority list
                priorityList.push({
                    'controller':controller,
                    'priority':spec.priority
                });

                // add to controllers
                controllers.push(controller);
            }
        }

        // sort controllers by priority:
        // higher numbers go first,
        // then 0 (or no priority assigned),
        // then negative numbers
        priorityList.sort(function(a,b){
            return b.priority - a.priority;
        });

        // initialize modules depending on assigned priority
        l = controllers.length;
        for (i=0; i<l; i++) {
            priorityList[i].controller.init();
        }

        // merge new controllers with current controllers
        this._controllers = this._controllers.concat(controllers);

        // returns copy of controllers so it is possible to later unload modules manually if necessary
        return controllers;
    };


    /**
     * Reads specifications for module from the element attributes
     *
     * @method _getBehaviorSpecificationsByElement
     * @param {Element} element - Element to parse
     * @return {Array} behavior specifications
     */
    p._getModuleSpecificationsByElement = function(element) {

        var path = element.getAttribute(this._options.attribute.module),
            multiple = path.charAt(0) === '[',
            result = [],
            conditions,
            alternate;

        // get multiple specs
        if (multiple) {

            // get conditions
            conditions = this._getElementAttributeAsObject(element,this._options.attribute.conditions);

            // specific vars for multiple elements
            var paths = this._getElementAttributeAsObject(element,this._options.attribute.module),
                options = this._getElementAttributeAsObject(element,this._options.attribute.options),
                priorities = this._getElementAttributeAsObject(element,this._options.attribute.priority),
                l=paths.length,
                i=0;

            for (;i<l;i++) {

                result.push({
                    'path':paths[i],
                    'conditions':conditions.length ? conditions[i] : conditions,
                    'options':options.length ? options[i] : options,
                    'priority':priorities.length ? priorities[i] : priorities,
                    'suitable':true
                });

            }

        }
        else {

            // get conditions, these are shared among default and alternate module
            conditions = element.getAttribute(this._options.attribute.conditions);

            // add default module
            result.push({
                'path':path,
                'conditions':conditions,
                'options':element.getAttribute(this._options.attribute.options),
                'priority':element.getAttribute(this._options.attribute.priority),
                'suitable':true
            });

            // test if alternate module specified
            alternate = element.getAttribute(this._options.attribute.alternative);

        }

        // if alternate specified
        if (alternate) {

            result.push({
                'path':alternate,
                'conditions':conditions,
                'options':null,
                'priority':element.getAttribute(this._options.attribute.priority),
                'suitable':false
            });

        }

        return result;

    };


    /**
     * Tries to convert element attribute value to an object
     *
     * @method _getElementAttributeAsObject
     * @param {Element} element - Element to find attribute on
     * @param {string} attribute - Attribute value to convert
     * @return {object} array or object
     */
    p._getElementAttributeAsObject = function(element,attribute) {

        var value = element.getAttribute(attribute);
        if (value) {
            try {
                return JSON.parse(value);
            }
            catch(e) {}
        }
        return [value];

    };


    /**
     * Returns ModuleControllers matching the selector
     *
     * @method getModule
     * @param {object} query - Query to match the ModuleController to, could be ClassPath, Element or CSS Selector
     * @return {object} controller - First matched ModuleController
     */
    p.getModule = function(query) {
        var controller,i=0,l = this._controllers.length;
        for (;i<l;i++) {
            controller = this._controllers[i];
            if (controller.matchesQuery(query)) {
                return controller;
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
            return this._controllers.concat();
        }
        var controller,i=0,l = this._controllers.length,results=[];
        for (;i<l;i++) {
            controller = this._controllers[i];
            if (controller.matchesQuery(query)) {
                results.push(controller);
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

}(ModuleRegister,ModuleController,mergeObjects,Test,Module,Observer));


// expose conditioner
return Conditioner;

});
