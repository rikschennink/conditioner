
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
             * @public
             */
            init:function(options){

                if (options) {
                    this.setOptions(options);
                }

                _loader.parse(document);

            },

            /**
             * Set custom options
             * @param {Object} options - options to override
             * @public
             */
            setOptions:function(options){

                if (!options) {
                    throw new Error('ModuleLoader.setOptions(options): "options" is a required parameter.');
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
            }

        };

    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        var Observer = require('./utils/Observer');
        var contains = require('./utils/contains');
        var matchesSelector = require('./utils/matchesSelector');
        var mergeObjects = require('./utils/mergeObjects');
        module.exports = factory(require,Observer,contains,matchesSelector,mergeObjects);
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