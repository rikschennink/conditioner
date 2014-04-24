(function(undefined){

    'use strict';

    // Promise
    // https://gist.github.com/814052/690a6b41dc8445479676b347f1ed49f4fd0b1637
    function Promise () {
        this._thens = [];
    }

    // jshint ignore:start
    Promise.prototype = {

        /* This is the "front end" API. */

        // then(onResolve, onReject): Code waiting for this promise uses the
        // then() method to be notified when the promise is complete. There
        // are two completion callbacks: onReject and onResolve. A more
        // robust promise implementation will also have an onProgress handler.
        then: function (onResolve, onReject) {
            // capture calls to then()
            this._thens.push({ resolve: onResolve, reject: onReject });
        },

        // Some promise implementations also have a cancel() front end API that
        // calls all of the onReject() callbacks (aka a "cancelable promise").
        // cancel: function (reason) {},

        /* This is the "back end" API. */

        // resolve(resolvedValue): The resolve() method is called when a promise
        // is resolved (duh). The resolved value (if any) is passed by the resolver
        // to this method. All waiting onResolve callbacks are called
        // and any future ones are, too, each being passed the resolved value.
        resolve: function (val) { this._complete('resolve', val); },

        // reject(exception): The reject() method is called when a promise cannot
        // be resolved. Typically, you'd pass an exception as the single parameter,
        // but any other argument, including none at all, is acceptable.
        // All waiting and all future onReject callbacks are called when reject()
        // is called and are passed the exception parameter.
        reject: function (ex) { this._complete('reject', ex); },

        // Some promises may have a progress handler. The back end API to signal a
        // progress "event" has a single parameter. The contents of this parameter
        // could be just about anything and is specific to your implementation.
        // progress: function (data) {},

        /* "Private" methods. */

        _complete: function (which, arg) {
            // switch over to sync then()

            this.then = which === 'resolve' ?
                function (resolve, reject) { resolve(arg); } :
                function (resolve, reject) { reject(arg); };
            // disallow multiple calls to resolve or reject
            this.resolve = this.reject =
                function () { throw new Error('Promise already completed.'); };
            // complete all waiting (async) then()s
            var aThen, i = 0;
            while (aThen = this._thens[i++]) { aThen[which] && aThen[which](arg); }
            delete this._thens;
        }

    };
    // jshint ignore:end

    // returns conditioner API
    var factory = function(require,Observer,contains,matchesSelector,mergeObjects) {

        // FACTORY <%= contents %>

        // conditioner options object
        var _options = {
            'attr':{
                'options':'data-options',
                'module':'data-module',
                'conditions':'data-conditions',
                'priority':'data-priority',
                'initialized':'data-initialized',
                'processed':'data-processed',
                'loading':'data-loading'
            },
            'loader':{
                'load':function(paths,callback){
                    require(paths,callback);
                },
                'config':function(path,options){
                    var config = {};
                    config[path] = options;
                    requirejs.config({
                        config:config
                    });
                },
                'toUrl':function(path) {
                    return requirejs.toUrl(path);
                }
            },
            'modules':{}
        };

        // setup loader instance
        var _loader =  new ModuleLoader();

        // expose API
        return {

            /**
             * Initialises the conditioner and parses the document for modules
             * @param {Object} [options] - optional options to override
             * @return {Array} of initialized nodes
             * @public
             */
            init:function(options){

                if (options) {
                    this.setOptions(options);
                }

                return _loader.parse(document);

            },

            /**
             * Set custom options
             * @param {Object} options - options to override
             * @public
             */
            setOptions:function(options){

                if (!options) {
                    throw new Error('Conditioner.setOptions(options): "options" is a required parameter.');
                }

                var config,path,mod,alias;

                // update options
                _options = mergeObjects(_options,options);

                // loop over modules
                for (path in _options.modules) {

                    if (!_options.modules.hasOwnProperty(path)){continue;}

                    // get module reference
                    mod = _options.modules[path];

                    // get alias
                    alias = typeof mod === 'string' ? mod : mod.alias;

                    // get config
                    config = typeof mod === 'string' ? null : mod.options || {};

                    // register this module
                    ModuleRegistry.registerModule(path,config,alias);

                }

            },

            /**
             * Loads all modules within the supplied dom tree
             * @param {Document|Element} context - Context to find modules in
             * @return {Array} - Array of found Nodes
             */
            parse:function(context) {

                if (!context) {
                    throw new Error('Conditioner.parse(context): "context" is a required parameter.');
                }

                return _loader.parse(context);

            },

            /**
             * Setup the given element with the passed module controller(s)
             * @param {Element} element - Element to bind the controllers to
             * @param {Array|ModuleController} controllers - module controller configurations
             * [
             *     {
             *         path: 'path/to/module',
             *         conditions: 'config',
             *         options: {
             *             foo: 'bar'
             *         }
             *     }
             * ]
             * @return {NodeController|null} - The newly created node or null if something went wrong
             */
            load:function(element,controllers) {

                return _loader.load(element,controllers);

            },

            /**
             * Returns a synced controller group which fires a load event once all modules have loaded
             * {ModuleController|NodeController} [arguments] - list of module controllers or node controllers to synchronize
             * @return SyncedControllerGroup.prototype
             */
            sync:function() {

                var group = Object.create(SyncedControllerGroup.prototype);

                // create synced controller group using passed arguments
                // test if user passed an array instead of separate arguments
                SyncedControllerGroup.apply(group,arguments.length === 1 && !arguments.slice ? arguments[0] : arguments);

                return group;

            },

            /**
             * Returns the first Node matching the selector
             * @param {String} [selector] - Selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @return {Node|null} First matched node or null
             */
            getNode:function(selector,context) {

                return _loader.getNodes(selector,context,true);

            },

            /**
             * Returns all nodes matching the selector
             * @param {String} [selector] - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @return {Array} Array containing matched nodes or empty Array
             */
            getNodes:function(selector,context) {

                return _loader.getNodes(selector,context,false);

            },

            /**
             * Destroy the passed node reference
             * @param node {NodeController}
             * @return {Boolean}
             * @public
             */
            destroyNode:function(node) {

                return _loader.destroyNode(node);

            },

            /**
             * Returns the first Module matching the selector
             * @param {String} path - Optional path to match the modules to
             * @param {String} selector - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @public
             */
            getModule:function(path,selector,context){

                var i=0,results = this.getNodes(selector,context),l=results.length,module;
                for (;i<l;i++) {
                    module = results[i].getModule(path);
                    if (module) {
                        return module;
                    }
                }
                return null;

            },

            /**
             * Returns multiple modules matching the given path
             * @param {String} path - Optional path to match the modules to
             * @param {String} selector - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @returns {Array|Node|null}
             * @public
             */
            getModules:function(path,selector,context) {

                var i=0,results = this.getNodes(selector,context),l=results.length,filtered=[],modules;
                for (;i<l;i++) {
                    modules = results[i].getModules(path);
                    if (modules.length) {
                        filtered = filtered.concat(modules);
                    }
                }
                return filtered;

            },

            /**
             * Manual run an expression
             * @param {String} expression - Expression to test
             * @returns {Promise}
             */
            test:function(expression) {

                var p = new Promise();

                setTimeout(function(){

                    p.resolve(expression ? true : false);

                },500);

                return p;

            }

        };

    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require,
            require('./utils/Observer'),
            require('./utils/contains'),
            require('./utils/matchesSelector'),
            require('./utils/mergeObjects')
        );
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(['require','./utils/Observer','./utils/contains','./utils/matchesSelector','./utils/mergeObjects'], factory);
    }
    // Browser globals
    else {
        throw new Error('To use ConditionerJS you need to setup a module loader like RequireJS.');
    }

}());