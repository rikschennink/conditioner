
Namespace.register('conditioner').Injector = (function(){

    var _args = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var _classes = {};

    var Injector = {

        /**
         * Register a Class
         * @method register
         * @param {String} id - identifier (interface) of Class
         * @param {String} uri - path to class
         * @param {Object} options - options to pass to instance
         */
        registerClass:function(id,uri,options) {
            _classes[id] = {
                'uri':uri,
                'options':options,
                'dependencies':null,
                'Class':null,
                'singleton':false
            };
        },

        constructClass:function(id,element) {

            // get class spec
            var specification = _classes[id];

            // if specifications not found, halt
            if (!specification) {
                return;
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
                else if (_classes[dependency]) {

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

            // get seperate parameters as array
            return matches[1].split(',');
        },








        /*
                getClassById:function(id,success) {

                    // get class spec
                    var spec = _classes[id];

                    // if specifications not found, halt
                    if (!spec) {
                        return;
                    }

                    // Load class by uri if no concrete class is available yet
                    if (!spec.concrete) {

                        Namespace.load(spec.uri,function(Class){

                            // Cache Class for future reference
                            spec.concrete = Class;

                            // find out if this class has dependencies
                            var dependencies = Injector._getDependenciesForClass(Class);

                            for (var i=0;i<dependencies.length;i++) {

                                // if not a registered dependency, skip
                                if (!_classes[dependencies[i]]) {
                                    continue;
                                }

                                // get
                                Injector.getClassById(dependencies[i]);

                            }



                        });
                    }

                },
               */




/*
        constructClass:function(Class,args) {
            function F() {
                return Class.apply(this,arguments[0])
            }
            F.prototype = Class.prototype;
            return new F(args);
        },
*/

        _getDependencies:function(ids) {
            var spec,specs=[],i=0,l=ids.length;
            for (;i<l;i++) {
                spec = _classes[ids[i]];
                if (!spec) {
                    continue;
                }
                specs.push(spec);
            }
            return specs;
        }
    };

    return Injector;

}());