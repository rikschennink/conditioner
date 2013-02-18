
Namespace.register('conditioner').Injector = (function(){

    var _args = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
        _dependencies = {};

    var Injector = {

        /**
         * Register a Dependency
         * @method register
         * @param {String} id - identifier (interface) of Class
         * @param {String} uri - path to class
         * @param {Object} options - options to pass to instance
         */
        registerDependency:function(id,uri,options) {
            _dependencies[id] = {
                'uri':uri,
                'options':options,
                'dependencies':null,
                'singleton':false,
                'Class':null
            };
        },

        constructClass:function(id,element) {

            // get dependency spec
            var specification = _dependencies[id];

            // if specifications not found, halt
            if (!specification) {
                return null;
            }

            // Load class by uri if no concrete class is available yet
            if (!specification.Class) {

                // Cache Class for future reference
                specification.Class = Namespace.find(specification.uri);

                // is this class a singleton
                specification.singleton = typeof specification.Class.getInstance != 'undefined';

            }

            // if is singleton, pass options and return
            if (specification.singleton) {
                var instance = specification.Class.getInstance();
                    instance.setOptions(specification.options);
                return instance;
            }

            // if dependencies not yet set, set now
            if (!specification.dependencies) {
                specification.dependencies = Injector._getDependenciesForClass(specification.Class);
            }

            // find out if this class has dependencies
            var dependency,dependencies=[];

            // construct dependencies
            for (var i=0;i<specification.dependencies.length;i++) {

                dependency = specification.dependencies[i];

                if (dependency == 'element') {
                    // is base element
                    dependencies.push(element);
                }
                else if (dependency == 'options') {
                    // is options, get from spec
                    dependencies.push(specification.options);
                }
                else if (_dependencies[dependency]) {

                    // is custom class
                    dependencies.push(Injector.constructClass(dependency));
                }
            }

            return Injector._getInstance(specification.Class,dependencies);
        },

        _getInstance:function(Class,args) {

            if (Class.getInstance) {
                return Class.getInstance();
            }

            var F = function() {
                return Class.apply(this,arguments[0]);
            };

            F.prototype = Class.prototype;
            return new F(args);

        },

        _getDependenciesForClass:function(Class) {

            var text = Class.toString(),
                matches = text.match(_args);

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