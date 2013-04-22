
/**
 * @class Conditioner
 */
var Conditioner = (function(ModuleRegister,ModuleController,Node,Test,Module,Observer,mergeObjects){


    /**
     * @constructor
     */
    var Conditioner = function() {

        // options for conditioner
        this._options = {
            'attribute':{
                'module':'data-module',
                'conditions':'data-conditions',
                'options':'data-options',
                'priority':'data-priority'
            },
            'modules':{}
        };

        // array of all parsed nodes
        this._nodes = [];

    };

    // prototype shortcut
    var p = Conditioner.prototype;


    /**
     * @method setOptions, set custom options
     * @param {object} options - options to override
     */
    p.setOptions = function(options) {

        // update options
        this._options = mergeObjects(this._options,options);

        // loop over modules
        var config,path,mod,alias;
        for (path in this._options.modules) {

            if (!this._options.modules.hasOwnProperty(path)){continue;}

            // get module reference
            mod = this._options.modules[path];

            // get alias
            alias = typeof mod === 'string' ? mod : mod.alias;

            // get config
            config = typeof mod === 'string' ? null : mod.options || {};

            // register this module
            ModuleRegister.registerModule(path,config,alias);

        }


    };


    /**
     * Loads modules within the given context.
     *
     * @method loadModules
     * @param {Element} context - Context to find modules in
     * @return {Array} - Array of initialized ModuleControllers
     */
    p.loadModules = function(context) {

        // if no context supplied throw error
        if (!context) {
            throw new Error('Conditioner.loadModules(context): "context" is a required parameter.');
        }

        // register vars and get elements
        var elements = context.querySelectorAll('[' + this._options.attribute.module + ']'),
            l = elements.length,
            i = 0,
            nodes = [],
            element;

        // if no elements do nothing
        if (!elements) {
            return [];
        }

        // process elements
        for (; i<l; i++) {

            // set element reference
            element = elements[i];

            // test if already processed
            if (Node.hasProcessed(element)) {
                continue;
            }

            // create new node
            nodes.push(new Node(element));
        }

        // sort nodes by priority:
        // higher numbers go first,
        // then 0 (or no priority assigned),
        // then negative numbers
        nodes.sort(function(a,b){
            return b.getPriority() - a.getPriority();
        });

        // initialize modules depending on assigned priority
        l = nodes.length;
        for (i=0; i<l; i++) {
            nodes[i].init();
        }

        // merge new nodes with currently active nodes list
        this._nodes = this._nodes.concat(nodes);

        // returns nodes so it is possible to later unload nodes manually if necessary
        return nodes;
    };


    /**
     * Returns ModuleControllers matching the selector
     *
     * @method getModule
     * @param {object} query - Query to match the ModuleController to, could be ClassPath, Element or CSS Selector
     * @return {object} controller - First matched ModuleController
     */
    p.getModule = function(query) {
        var i=0,l = this._nodes.length,node;
        for (;i<l;i++) {
            node = this._nodes[i];
            if (node.matchesQuery(query)) {
                return node;
            }
        }
        return null;
    };


    /**
     * Returns all ModuleControllers matching the selector
     *
     * @method getModuleAll
     * @param {object} query - Query to match the controller to, could be ClassPath, Element or CSS Selector
     * @return {Array} results - Array containing matched behavior controllers
     */
    p.getModuleAll = function(query) {
        if (typeof query == 'undefined') {
            return this._nodes.concat();
        }
        var i=0,l = this._node.length,results=[],node;
        for (;i<l;i++) {
            node = this._nodes[i];
            if (node.matchesQuery(query)) {
                results.push(node);
            }
        }
        return results;
    };


    // Singleton structure
    var _instance;

    return {

        /**
         * Returns an instance of the Conditioner
         * @method getInstance
         * @return instance of Conditioner
         */
        getInstance:function() {
            if (!_instance) {_instance = new Conditioner();}
            return _instance;
        },

        /**
         * Reference to Test base class
         */
        Test:Test,

        /**
         * Reference to Module base class
         */
        Module:Module,

        /**
         * Reference to Observer class
         */
        Observer:Observer,

        /**
         * Reference to updateObject method
         */
        mergeObjects:mergeObjects

    };

}(ModuleRegister,ModuleController,Node,Test,Module,Observer,mergeObjects));
