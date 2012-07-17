
var Namespace = {

    _cache:[],

    register:function(ns) {

        var i,levels,root;

        if (typeof(ns) === 'string') {

            // check if cached
            if (this._cache[ns]) {
                return this._cache[ns];
            }

            // build new ns object
            levels = ns.split('.');
            root = window;

            for (i=0;levels[i]!=undefined;i++) {
                if (typeof(root[levels[i]]) === 'undefined') {
                    root[levels[i]] = {};
                }
                root = root[levels[i]];
            }

            // store in cache
            this._cache[ns] = root;

            // return root element
            return root;
        }
        else {
            throw new Error('Namespace.register(ns) - ns should be in string format e.g. ("foo.bar")');
        }

        return null;
    }
};
