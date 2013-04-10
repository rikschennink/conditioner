// conditioner v0.8.1 - A JavaScript framework for conditionally loading UI classes
// Copyright (c) 2013 Rik Schennink - https://github.com/rikschennink/conditioner
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

define(['require'],function(require){

/**
 * @module Conditioner
 */

'use strict';


/**
 * Creates a new object based on original object properties updated with the additions
 * @method updateObject
 * @param {object} original - The original object
 * @param {object} additions - The properties to override
 * @return {object} The result of the update
 */
var updateObject = function(original,additions) {

    var p,result = {};

    for(p in original) {
        if (!original.hasOwnProperty(p)) {continue;}
        result[p] = typeof original[p] == 'object' ? updateObject(original[p],additions[p]) : original[p];
    }

    for(p in additions) {
        if (!additions.hasOwnProperty(p)) {continue;}
        result[p] = typeof additions[p] == 'object' ? updateObject(original[p],additions[p]) : additions[p];
    }

    return result;

};


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
var Module = (function(updateObject) {

    /**
     * @constructor
     * @param {node} element - DOM Element to apply this behavior to
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
        this._options = options ? updateObject(this._options,options) : this._options;

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

}(updateObject));


/**
 * @class Test
 */
var Test = (function(Observer){

    /**
     * @constructor
     * @param {object} expected - expected conditions to be met
     * @param {node} [element] - optional element to measure these conditions on
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
 * @class TestManager
 */
var TestManager = {

    _tests:{},

    /**
     * @method defineTest
     * @param {string} key - Test identifier
     * @param {function} path - The path to the test
     */
    registerTest:function(key,path) {

        if (!key || !path) {
            throw new Error('TestManager.defineTest(key,path): Both "key" and "path" are required parameters.');
        }

        this._tests[key] = path;
    },

    /**
     * @method loadTestByKey
     * @param {string} key - Test identifier
     * @param {function} success - callback for when the test module was loaded successfully
     */
    loadTestByKey:function(key,success) {

        if (!key || !success) {
            throw new Error('TestManager.getTestByKey(key,success): Both "key" and "success" are required parameters.');
        }

        // get path to test
        var path = this._tests[key] || 'tests/' + key;

        // get test by key
        require([path],function(Test){
            success(Test);
        });

    }

};


/**
 * @class DependencyRegister
 */
var DependencyRegister = {

    _dependencies:{},

    /**
     * Register a dependency
     * @method register
     * @param {string} id - identifier (interface) of Class
     * @param {string} path - path to module
     * @param {object} options - options to pass to instance
     */
    registerDependency:function(id,path,options) {

        // setup mapping
        var map = {};
        map[id] = path;

        // setup options
        var config = {};
        config[path] = options;

        // update requirejs config
        requirejs.config({
            map:{
                '*':map
            },
            config:config
        });

        // set dependencies
        this._dependencies[id] = {
            'options':options || {},
            'dependencies':null,
            'klass':null
        };

    },

    /**
     * Get a registered dependency
     * @method getSpecification
     * @param {string} id - identifier (interface) of Class
     * @return {object} - class specification object
     */
    getSpecification:function(id) {

        // if no id supplied throw error
        if (!id) {
            throw new Error('DependencyManager.getSpecification(id): "id" is a required parameter.');
        }

        return this._dependencies[id];
    }

};


/**
 * Constructs ConditionManager objects.
 * @class ConditionManager
 */
var ConditionManager = (function(TestManager){

    /**
     * @constructor
     * @param {object} expected - expected conditions to be met
     * @param {node} [element] - optional element to measure these conditions on
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
         * @param {string} key - Key related to the test to load
         * @param {object} expected - Expected value for this test
         * @param {node} [element] - Element related to this test
         */
        _loadTest:function(key,expected,element) {

            var self = this;

            TestManager.loadTestByKey(key,function(Test){

                //condition = new Condition(
                var test = new Test(expected[key],element);

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

}(TestManager));


/**
 * @class BehaviorController
 */
var BehaviorController = (function(require,DependencyRegister,ConditionManager,matchesSelector,updateObject){

    /**
     * @constructor
     * @param {string} id - id of behavior
     * @param {object} options - options for this behavior controller
     */
    var BehaviorController = function(id,options) {

        // if no element, throw error
        if (!id) {
            throw new Error('BehaviorController(id,options): "id" is a required parameter.');
        }

        // options for class behavior controller should load
        this._id = id;

        // options for behavior controller
        this._options = options || {};

    };


    // prototype shortcut
    var p = BehaviorController.prototype;


    /**
     * Initializes the behavior controller
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

        // if already suitable, load behavior
        if (this._conditionManager.getSuitability()) {
            this._loadBehavior();
        }

    };


    /**
     * Called when the conditions change.
     * @method _onConditionsChange
     */
    p._onConditionsChange = function() {

        var suitable = this._conditionManager.getSuitability();

        if (this._behavior && !suitable) {
            this.unloadBehavior();
        }

        if (!this._behavior && suitable) {
            this._loadBehavior();
        }

    };


    /**
     * Load the behavior set in the data-behavior attribute
     * @method _loadBehavior
     */
    p._loadBehavior = function() {

        // get specification for this behavior
        var self = this,specs = DependencyRegister.getSpecification(this._id);

        // if no specifications not found, stop
        if (!specs) {
            return;
        }

        // if class not specified load async
        if (!specs.klass) {

            require([this._id],function(klass){

                if (!klass) {
                    return;
                }

                // set class for future reference
                specs.klass = klass;

                // try again
                self._loadBehavior();

            });

            return;
        }


        // parse options
        var options;
        if (typeof this._options.options == 'string') {
            try {
                options = JSON.parse(this._options.options);
            }
            catch(e) {}
        }
        else {
            options = this._options.options;
        }

        // merge options
        options = updateObject(specs.options,options);

        // create instance of behavior klass
        this._behavior = new specs.klass(this._options.target,options);

        // propagate events from behavior to behaviorController
        Observer.setupPropagationTarget(this._behavior,this);

    };


    /**
     * Public method for unloading the behavior
     * @method unloadBehavior
     * @return {boolean}
     */
    p.unloadBehavior = function() {

        if (!this._behavior) {
            return false;
        }

        // unload behavior if possible
        if (this._behavior._unload) {
            this._behavior._unload();
        }

        // reset property
        this._behavior = null;

        return true;
    };


    /**
     * Public method to check if the behavior matches the given query
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
     * Public method for safely executing methods on the loaded behavior
     * @method execute
     * @param {string} method - method key
     * @param {Array} [params] - array containing the method parameters
     * @return
     */
    p.execute = function(method,params) {

        // if behavior not loaded
        if (!this._behavior) {
            return null;
        }

        // get function reference
        var F = this._behavior[method];
        if (!F) {
            throw new Error('Conditioner(method,params): "method" not found on behavior.');
        }

        // once loaded call method and pass parameters
        return F.apply(this._behavior,params);

    };

    return BehaviorController;

}(require,DependencyRegister,ConditionManager,matchesSelector,updateObject));


/**
 * @class Conditioner
 */
var Conditioner = (function(DependencyRegister,BehaviorController,updateObject,Test,Module,Observer){

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
            }
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
        this._options = updateObject(this._options,options);
    };


    /**
     * Register multiple dependencies, shortcut method to DependencyRegister.registerDependency()
     * @method registerDependencies
     */
    p.registerDependencies = function() {
        var dependency,i=0,l=arguments.length;
        for (;i<l;i++) {
            dependency = arguments[i];
            DependencyRegister.registerDependency(dependency.id,dependency.path,dependency.options);
        }
    };


    /**
     * Applies behavior on object within given context.
     *
     * @method applyBehavior
     * @param {node} context - Context to apply behavior to
     * @return {Array} - Array of initialized BehaviorControllers
     */
    p.applyBehavior = function(context) {

        // if no context supplied throw error
        if (!context) {
            throw new Error('Conditioner.applyBehavior(context,options): "context" is a required parameter.');
        }

        // register vars and get elements
        var elements = context.querySelectorAll('[' + this._options.attribute.module + ']'),
            l = elements.length,
            i=0,
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
            specs = this._getBehaviorSpecificationsByElement(element);

            // apply specs
            while (spec = specs.shift()) {

                // create controller instance
                controller = new BehaviorController(
                    spec.id,{
                        'target':element,
                        'conditions':spec.conditions,
                        'options':spec.options
                    }
                );

                // add to prio list
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

        // initialize behavior depending on assigned priority
        l = controllers.length;
        for (i=0; i<l; i++) {
            priorityList[i].controller.init();
        }

        // merge new controllers with current controllers
        this._controllers = this._controllers.concat(controllers);

        // returns copy of controllers so it is possible to later unload behavior manually if necessary
        return controllers;
    };


    /**
     * Reads specifications for behavior from the element attributes
     *
     * @method _getBehaviorSpecificationsByElement
     * @param {node} element - Element to parse
     * @return {Array} behavior specifications
     */
    p._getBehaviorSpecificationsByElement = function(element) {

        var behavior = element.getAttribute(this._options.attribute.module),
            multiple = behavior.charAt(0) === '[';

        // get multiple specs
        if (multiple) {

            var behaviorIds = this._getElementAttributeAsObject(element,this._options.attribute.module),
                conditions = this._getElementAttributeAsObject(element,this._options.attribute.conditions),
                options = this._getElementAttributeAsObject(element,this._options.attribute.options),
                priorities = this._getElementAttributeAsObject(element,this._options.attribute.priority),
                l=behaviorIds.length,
                i=0,
                result = [];

            for (;i<l;i++) {

                result.push({
                    'id':behaviorIds[i],
                    'conditions':conditions.length ? conditions[i] : conditions,
                    'options':options.length ? options[i] : options,
                    'priority':priorities.length ? priorities[i] : priorities
                });

            }
            return result;
        }

        // get single spec
        return [{
            'id':behavior,
            'conditions':element.getAttribute(this._options.attribute.conditions),
            'options':element.getAttribute(this._options.attribute.options),
            'priority':element.getAttribute(this._options.attribute.priority)
        }];

    };


    /**
     * Tries to convert element attribute value to an object
     *
     * @method _getElementAttributeAsObject
     * @param {node} element - Element to find attribute on
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
     * Returns BehaviorControllers matching the selector
     *
     * @method getBehavior
     * @param {object} query - Query to match the controller to, could be ClassPath, Element or CSS Selector
     * @return {object} controller - First matched BehaviorController
     */
    p.getBehavior = function(query) {
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
     * Returns all BehaviorControllers matching the selector
     *
     * @method getBehaviorAll
     * @param {object} query - Query to match the controller to, could be ClassPath, Element or CSS Selector
     * @return {Array} results - Array containing matched behavior controllers
     */
    p.getBehaviorAll = function(query) {
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
        updateObject:updateObject

    };

}(DependencyRegister,BehaviorController,updateObject,Test,Module,Observer));


// expose conditioner
return Conditioner;

});
