
/**
 * @exports Conditioner
 * @class
 * @constructor
 * @private
 */
var Conditioner = function() {

    // options for conditioner
    this._options = {
        'attribute':{
            'module':'data-module'
        },
        'modules':{}
    };

    // array of all parsed nodes
    this._nodes = [];

};

Conditioner.prototype = {

    /**
     * Set custom options
     * @param {object} options - options to override
     * @public
     */
    setOptions:function(options) {

        // update options
        this._options = Utils.mergeObjects(this._options,options);

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
    },

    /**
     * Loads modules within the given context
     * @param {element} context - Context to find modules in
     * @return {Array} - Array of initialized ModuleControllers
     */
    loadModules:function(context) {

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
    },


    /**
     * Returns ModuleControllers matching the selector
     * @param {string} selector - Selector to match the nodes to
     * @return {Node} First matched node
     */
    getNode:function(selector) {
        return this._filterNodes(selector,true);
    },


    /**
     * Returns all ModuleControllers matching the selector
     * @param {string} selector - Optional selector to match the nodes to
     * @return {Array} Array containing matched nodes
     */
    getNodesAll:function(selector) {
        return this._filterNodes(selector,false);
    },


    /**
     * Returns a single or multiple module controllers matching the given selector
     * @param selector {string}
     * @param single {boolean}
     * @returns {Array|Node}
     * @private
     */
    _filterNodes:function(selector,single) {

        // if no query supplied
        if (typeof selector === 'undefined') {
            return single ? null : [];
        }

        // find matches
        var i=0,l = this._nodes.length,results=[],node;
        for (;i<l;i++) {
            node = this._nodes[i];
            if (node.matchesSelector(selector)) {
                if (single) {
                    return node;
                }
                results.push(node);
            }
        }

        return single ? null : results;

    }

};