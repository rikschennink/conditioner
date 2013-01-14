
/**
 * Conditioner Singleton
 *
 * @class Conditioner
 */
var Conditioner = (function() {

    'use strict';


    /**
     * @static Tests
     * @constructor
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






    var _instance;

    /**
     * @class Conditioner
     * @constructor
     */
    var Conditioner = function() {
        this._controllers = [];
    };

    var p = Conditioner.prototype;





    p.registerTest = function(key,arrange,assert) {
        if (!key) {
            throw new Error('Conditioner.registerTest(key,arrange,assert): "key" is a required parameter.');
        }
        Tests.registerTest(key,arrange,assert);
    };

    p.getTestByKey = function(key) {
        return Tests.getTestByKey(key);
    };



    /**
     * Applies behaviour on object within given context.
     *
     * @class Conditioner
     * @method applyBehavior
     * @param {Node}
     * @param {Object}
     */
    p.applyBehavior = function(context,options) {

        // if no context supplied use document
        if (!context) {
            console.warn('Conditioner.applyBehavior(context,options): "context" is a required parameter');
        }

        // if no options, set empty options object
        options = options || {};

        // register vars and get elements
        var controllers = [],
            element,elements = context.querySelectorAll('[data-behavior]:not([data-processed])',context),
            i,l = elements.length;

        // if no elements do nothing
        if (!elements) {
            return;
        }

        // process elements
        for (i=0; i<l; i++) {

            // set element reference
            element = elements[i];

            // has been processed
            element.setAttribute('data-processed','true');

            // feed to controller
            controllers.push(

                new conditioner.BehaviorController(
                    element,
                    options[element.getAttribute('data-behaviour')],
                    options['conditioner.BehaviorController']
                )

            );

        }

        // merge with current controllers
        this._controllers = this._controllers.concat(controllers);

        // returns copy of loaders so it is possible to later unload them if necessary
        return controllers;
    };


    // Singleton
    return {
        getInstance:function() {
            if (!_instance) {_instance = new Conditioner();}
            return _instance;
        }
    };

}());
