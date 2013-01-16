/**
 * @module Namespace
 */
var Namespace = (function(){

    'use strict';

    // Namespace cache object
    var _cache = {
        'namespace':{},
        'class':{}
    };

    // References to scripts being loaded
    var _scripts = [];

    return {

        baseURL:'',

        register:function(ns) {

            if (typeof(ns) != 'string') {
                throw new Error('Namespace.register(ns): "ns" should be in string format e.g. ("foo.bar")');
            }

            // define vars
            var i,levels,root,cachedReference = _cache['namespace'][ns];

            // check if cached
            if (cachedReference) {return cachedReference;}

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
            _cache['namespace'][ns] = root;

            // return root element
            return root;

        },

        find:function(classPath) {

            if (!classPath) {
                throw new Error('Namespace.find(classPath): "classPath" is a required parameter');
            }

            // define vars
            var Class,levels,depth,i,cachedReference = _cache['class'][classPath];

            // check if aws cached
            if (cachedReference) {return cachedReference;}

            levels = classPath.split('.');
            depth = levels.length;
            Class = window;

            for (i=0;i<depth; i++) {
                if (Class[levels[i]] === undefined) {
                    return null;
                }
                Class = Class[levels[i]];
            }

            // cache result
            _cache['class'][classPath] = Class;

            return Class;
        },

        load:function(classPath,success,failure) {

            // try to find class by classpath
            var Class = this.find(classPath);

            // if found call success method
            if (Class) {
                success(Class);
                return;
            }

            // define vars
            var self = this,i,script,url = this.baseURL + classPath.replace(/\./g,'/') + '.js';

            // check if already loading this script
            for (i=_scripts.length-1;i>=0;i--) {
                if (_scripts[i].url === url) {
                    if (failure) {
                        failure('Already loading or could not find Class: "' + classPath + '"');
                    }
                    return;
                }
            }

            // request resource
            script = ScriptLoader.load(url,
                function(){
                    return (function(classPath,success,failure){

                        Class = self.find(classPath);
                        if (Class) {
                            success(Class);
                        }
                        else if (failure) {
                            failure('Failed to load Class: "' + classPath + '"')
                        }

                    }(classPath,success,failure))
                }
            );
            _scripts.push(script);

        }

    };

}());