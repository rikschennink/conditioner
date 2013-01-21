
Namespace.register('conditioner').Injector = (function(){

    var _args = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var _dependencies = {};

    return {

        // not really related to injector
        construct:function(Class,args) {
            function F() {
                return Class.apply(this,arguments[0])
            }
            F.prototype = Class.prototype;
            return new F(args);
        },


        // injector
        getDependencies:function(Class) {

            var text = Class.toString();
            var args = text.match(_args)[1].split(',');
            return this._getDependencies(args);

        },

        _getDependencies:function(arr) {
            var dep,deps=[],i=0,l=arr.length;
            for (;i<l;i++) {
                dep = _dependencies[arr[i]];
                if (!dep) {
                    continue;
                }
                deps.push(dep);
            }
            return deps;
        },

        register:function(name,Class,options) {
            _dependencies[name] = {
                'Class':Class,
                'options':options
            };
        }

    };

}());