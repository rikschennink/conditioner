/**
 * @module Injector
 */
define(['require','./MergeObjects'],function(require,updateObject){

    var _argsRegex = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
        _dependencies = {};

    var Injector = {

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
            _dependencies[id] = {
                'options':options || {},
                'dependencies':null,
                'klass':null
            };
        },


        /**
         * Construct a Class
         * @method constructClass
         * @param {String} id - identifier (interface) of Class
         * @param {Element} element - element parameter
         * @param {Object} options - options for Class
         * @param {Function} success - callback method to return constructed Class
         */
        constructClass:function(id,element,options,success) {

            // get dependency spec
            var specification = _dependencies[id];

            // if specifications not found, stop
            if (!specification) {
                return;
            }

            // if class for this spec is not known yet, find it
            if (!specification.klass) {

                require([id],function(klass){
                //require([specification.path],function(klass){

                    if (!klass) {
                        return;
                    }

                    specification.klass = klass;

                    Injector.constructClass(id,element,options,success);

                });

                return;
            }

            // if this Class is a singleton, get an instance and set it's options
            if (typeof specification.klass.getInstance != 'undefined') {
                var instance = specification.klass.getInstance();
                    instance.setOptions(specification.options);
                success(instance);
                return;
            }

            // if dependencies not yet set, set now
            if (!specification.dependencies) {
                specification.dependencies = Injector._getDependenciesForClass(specification.klass);
            }

            // find out if this class has dependencies
            var i=0,dependency,dependencies=[];

            // construct dependencies
            for (;i<specification.dependencies.length;i++) {

                dependency = specification.dependencies[i];

                // is base element
                if (dependency == 'element') {
                    dependencies[i] = element;
                }

                // is options, get from spec
                else if (dependency == 'options') {

                    if (typeof options == 'string') {
                        try {
                            options = JSON.parse(options);
                        }
                        catch(e) {}
                    }

                    dependencies[i] = updateObject(specification.options,options);
                }
            }

            success(Injector._getInstanceOfClass(specification.klass,dependencies));
        },

        /**
         * Returns an instance of the Class passing the given arguments
         * @method _getInstanceOfClass
         * @param {Function} klass - Class constructor
         * @param {Array} args - Class constructor arguments to pass
         * @return {Object} - Instance of supplied Class
         */
        _getInstanceOfClass:function(klass,args) {

            if (klass.getInstance) {
                return klass.getInstance();
            }

            var F = function() {
                return klass.apply(this,arguments[0]);
            };

            F.prototype = klass.prototype;
            return new F(args);

        },

        /**
         * Returns the dependencies for the supplied Class constructor
         * @method _getDependenciesForClass
         * @param {Function} klass - Class constructor
         * @return {Array} - Array of dependencies as Strings
         */
        _getDependenciesForClass:function(klass) {

            var text = klass.toString(),
                matches = text.match(_argsRegex);

            // if no matches found, no constructor parameters
            if (!matches) {
                return [];
            }

            // get separate parameters as array
            return matches[1].split(',');
        }
    };


    return Injector;

});
