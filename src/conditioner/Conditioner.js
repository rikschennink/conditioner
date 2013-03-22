/**
 * @module conditioner/Conditioner
 */
var Conditioner = (function(Injector,BehaviorController) {

    'use strict';


    /**
     * Tests
     */
    var Tests = {

        _tests:[],

        registerTest:function(key,arrange,assert) {

            var test = this._tests[key] = {};
                test.arrange = arrange;
                test.assert = assert;


        },

        getTestByKey:function(key) {
            return this._tests[key];
        }

    };



    /**
     * @class Conditioner (Singleton)
     * @constructor
     */
    var Conditioner = function() {
        this._controllers = [];
    };

    var p = Conditioner.prototype;





    /**
     * @method registerTest
     * @param {string} key - Test identifier
     * @param {function} arrange - Test arrange method
     * @param {function} assert - Test assert method
     */
    p.registerTest = function(key,arrange,assert) {

        if (!key) {
            throw new Error('Conditioner.registerTest(key,arrange,assert): "key" is a required parameter.');
        }

        Tests.registerTest(key,arrange,assert);
    };

    /**
     * @method getTestByKey
     * @param {string} key - Test identifier
     * @return {Object} a Test
     */
    p.getTestByKey = function(key) {

        if (!key) {
            throw new Error('Conditioner.getTestByKey(key): "key" is a required parameter.');
        }

        return Tests.getTestByKey(key);
    };





    /**
     * Register multiple dependencies
     * @method registerDependencies
     */
    p.registerDependencies = function() {
        var dependency,i=0,l=arguments.length;
        for (;i<l;i++) {
            dependency = arguments[i];
            Injector.registerDependency(dependency.id,dependency.uri,dependency.options);
        }
    };


    /**
     * @method registerDependency
     * @param {String} id - identifier (interface) of Class
     * @param {String} uri - class path
     * @param {Object} options - options to pass to instance
     */
    p.registerDependency = function(id,uri,options) {
        Injector.registerDependency(id,uri,options);
    };



    /**
     * Applies behavior on object within given context.
     *
     * @method applyBehavior
     * @param {Node} context - Context to apply behavior to
     * @return {Array} - Array of initialized BehaviorControllers
     */
    p.applyBehavior = function(context) {

        // if no context supplied throw error
        if (!context) {
            throw new Error('Conditioner.applyBehavior(context,options): "context" is a required parameter.');
        }

        // register vars and get elements
        var controllers = [],controller,
            priorityList = [],priorityLevel,
            behaviorId,behavior,
            element,elements = context.querySelectorAll('[data-behavior]'),
            i=0,l = elements.length;

        // if no elements do nothing
        if (!elements) {
            return [];
        }

        // process elements
        for (; i<l; i++) {

            // set element reference
            element = elements[i];

            // skip element if already processed
            if (element.getAttribute('data-processed')==='true') {
                continue;
            }

            // has been processed
            element.setAttribute('data-processed','true');

            // get specs
            var spec,specs = this._getBehaviorSpecificationsByElement(element);
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


    p._getBehaviorSpecificationsByElement = function(element) {

        var result = [],
            behaviorIds = this._getElementAttributeAsObject(element,'data-behavior'),
            conditions = this._getElementAttributeAsObject(element,'data-conditions'),
            priorities = this._getElementAttributeAsObject(element,'data-priority'),
            options = this._getElementAttributeAsObject(element,'data-options'),
            i=0,l=behaviorIds.length;


        for (;i<l;i++) {

            result.push({
                'id':behaviorIds[i],
                'conditions':conditions.length ? conditions[i] : conditions,
                'options':options.length ? options[i] : options,
                'priority':priorities.length ? priorities[i] : priorities
            });

        }

        return result;
    };


    /**
     * Tries to convert element attribute value to an object
     *
     * @method _getElementAttributeAsObject
     * @param {Node} element - Element to find attribute on
     * @param {String} attribute - Attribute value to convert
     * @return {Object} array or object
     */
    p._getElementAttributeAsObject = function(element,attribute) {

        var value = element.getAttribute(attribute);
        if (value) {
            try {
                return JSON.parse(value);
            }
            catch (e) {}
        }
        return [value];

    };


    /**
     * Returns BehaviorControllers matching the selector
     *
     * @method getBehavior
     * @param {Object} query - Query to match the controller to, could be ClassPath, Element or CSS Selector
     * @return {Object} controller - First matched BehaviorController
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
     * @param {Object} query - Query to match the controller to, could be ClassPath, Element or CSS Selector
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
        }

    };

}(conditioner.Injector,conditioner.BehaviorController));
