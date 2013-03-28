
/**
 * @module Conditioner
 */
define(['./Injector','./BehaviorController','./TestManager'],function(Injector,BehaviorController,TestManager) {

    'use strict';

    /**
     * @class Conditioner (Singleton)
     * @constructor
     */
    var Conditioner = function() {
        this._controllers = [];
    };

    var p = Conditioner.prototype;


    /**
     * @method registerTests, shortcut method to TestManager.registerTest()
     */
    p.registerTests = function() {
        var test,i=0,l=arguments.length;
        for (;i<l;i++) {
            test = arguments[i];
            TestManager.registerTest(test.id,test.path);
        }
    };


    /**
     * Register multiple dependencies, shortcut method to Injector.registerDependency()
     * @method registerDependencies
     */
    p.registerDependencies = function() {
        var dependency,i=0,l=arguments.length;
        for (;i<l;i++) {
            dependency = arguments[i];
            Injector.registerDependency(dependency.id,dependency.path,dependency.options);
        }
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
        var elements = context.querySelectorAll('[data-behavior]'),
            l = elements.length,
            i=0,
            controllers = [],
            priorityList = [],
            controller,
            behavior,
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
            if (element.getAttribute('data-processed')=='true') {
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
     * @param {Node} element - Element to parse
     * @return {Array} behavior specifications
     */
    p._getBehaviorSpecificationsByElement = function(element) {

        var behavior = element.getAttribute('data-behavior'),
            multiple = behavior.charAt(0) === '[';

        // get multiple specs
        if (multiple) {

            var behaviorIds = this._getElementAttributeAsObject(element,'data-behavior'),
                conditions = this._getElementAttributeAsObject(element,'data-conditions'),
                options = this._getElementAttributeAsObject(element,'data-options'),
                priorities = this._getElementAttributeAsObject(element,'data-priority'),
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
            'conditions':element.getAttribute('data-conditions'),
            'options':element.getAttribute('data-options'),
            'priority':element.getAttribute('data-priority')
        }];

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

});
