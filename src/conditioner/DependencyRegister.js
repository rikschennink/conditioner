/**
 * @module Injector
 */
define(['require','./MergeObjects'],function(require,updateObject){

    'use strict';

    return {

        _dependencies:{},

        /**
         * Register a dependency
         * @method register
         * @param {String} id - identifier (interface) of Class
         * @param {String} path - path to module
         * @param {Object} options - options to pass to instance
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
         * @param {String} id - identifier (interface) of Class
         * @return {Object} - class specification object
         */
        getSpecification:function(id) {
            return this._dependencies[id];
        }

    };

});