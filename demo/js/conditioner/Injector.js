
Namespace.register('conditioner').Injector = (function(){

    var _argsRegex = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
        _dependencies = {};

    var Injector = {

        /**
         * Register a Dependency
         * @method register
         * @param {String} id - identifier (interface) of Class
         * @param {String} uri - class path
         * @param {Object} options - options to pass to instance
         */
        registerDependency:function(id,uri,options) {
            _dependencies[id] = {
                'uri':uri,
                'options':options,
                'dependencies':null,
                'Class':null
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
            if (!specification.Class) {

                // load the class, if found, retry to class construction
                Namespace.load(

                    // classpath
                    specification.uri,

                    // class loaded callback
                    function(Class) {

                        // class loaded and ready to be added to specification
                        specification.Class = Class;

                        // try again
                        Injector.constructClass(id,element,options,success);

                    },
                    function(error) {
                        throw new Error(error);
                    }
                );
                return;
            }

            // if this Class is a singleton, get an instance and set it's options
            if (typeof specification.Class.getInstance != 'undefined') {
                var instance = specification.Class.getInstance();
                    instance.setOptions(specification.options);
                success(instance);
                return;
            }

            // if dependencies not yet set, set now
            if (!specification.dependencies) {
                specification.dependencies = Injector._getDependenciesForClass(specification.Class);
            }

            // find out if this class has dependencies
            var i=0,dependency,dependencies=[];

            // construct dependencies
            for (;i<specification.dependencies.length;i++) {

                dependency = specification.dependencies[i];

                if (dependency == 'element') {
                    // is base element
                    dependencies[i] = element;
                }
                else if (dependency == 'options') {
                    // is options, get from spec
                    dependencies[i] = options ? Options.merge(specification.options,options) : specification.options;
                }
                else if (_dependencies[dependency]) {

                    // is custom class
                    Injector.constructClass(
                        dependency,
                        element,
                        options,
                        function(index){
                            return function(instance) {
                                dependencies[index] = instance;
                            };
                        }(i)
                    );

                }
            }

            success(Injector._getInstanceOfClass(specification.Class,dependencies));
        },

        /**
         * Returns an instance of the Class passing the given arguments
         * @method _getInstanceOfClass
         * @param {Function} Class - Class constructor
         * @param {Array} args - Class constructor arguments to pass
         * @return {Object} - Instance of supplied Class
         */
        _getInstanceOfClass:function(Class,args) {

            if (Class.getInstance) {
                return Class.getInstance();
            }

            var F = function() {
                return Class.apply(this,arguments[0]);
            };

            F.prototype = Class.prototype;
            return new F(args);

        },

        /**
         * Returns the dependencies for the supplied Class constructor
         * @method _getDependenciesForClass
         * @param {Function} Class - Class constructor
         * @return {Array} - Array of dependencies as Strings
         */
        _getDependenciesForClass:function(Class) {

            var text = Class.toString(),
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


}());