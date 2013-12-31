/**
 * @exports ModuleLoader
 * @class
 * @constructor
 */
var ModuleLoader = function() {

	// options for ModuleLoader
	this._options = {
		'modules':{}
	};

	// array of all parsed nodes
	this._nodes = [];
};

ModuleLoader.prototype = {

    /**
     * Initialises the conditioner and parses the document for modules
     * @param {Object} [options] - optional options to override
     * @public
     */
    init:function(options) {

        if (options) {
            this.setOptions(options);
        }

        this.parse(document);

    },

	/**
	 * Set custom options
	 * @param {Object} options - options to override
	 * @public
	 */
	setOptions:function(options) {

		if (!options) {
			throw new Error('ModuleLoader.setOptions(options): "options" is a required parameter.');
		}

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
			ModuleRegistry.registerModule(path,config,alias);

		}
	},


	/**
	 * Loads all modules within the supplied dom tree
	 * @param {Document|Element} context - Context to find modules in
	 * @return {Array} - Array of found Nodes
	 */
	parse:function(context) {

		// if no context supplied, throw error
		if (!context) {
			throw new Error('ModuleLoader.loadModules(context): "context" is a required parameter.');
		}

		// register vars and get elements
		var elements = context.querySelectorAll('[data-module]'),
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
			if (NodeController.hasProcessed(element)) {
				continue;
			}

			// create new node
			nodes.push(new NodeController(element));
		}

		// sort nodes by priority:
		// higher numbers go first,
		// then 0 (a.k.a. no priority assigned),
		// then negative numbers
		// note: it's actually the other way around but that's because of the reversed while loop coming next
		nodes.sort(function(a,b){
			return a.getPriority() - b.getPriority();
		});

		// initialize modules depending on assigned priority (in reverse, but priority is reversed as well so all is okay)
		i = nodes.length;
		while (--i >= 0) {
			nodes[i].load(this._getModuleControllersByElement(nodes[i].getElement()));
		}

		// merge new nodes with currently active nodes list
		this._nodes = this._nodes.concat(nodes);

		// returns nodes so it is possible to later unload nodes manually if necessary
		return nodes;
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

        if (!controllers) {return null;}

        // if controllers is object put in array
        controllers = controllers.length ? controllers : [controllers];

        // vars
        var node,i=0,l=controllers.length,moduleControllers=[],controller;

        // create node
        node = new NodeController(element);

        // create controllers
        for (;i<l;i++) {
            controller = controllers[i];
            moduleControllers.push(
                new ModuleController(controller.path,element,{
                    'conditions':controller.conditions,
                    'options':controller.options
                })
            );
        }

        // create initialize
        node.load(moduleControllers);

        // remember so can later be retrieved through getNode methodes
        this._nodes.push(node);

        // return the loaded Node
        return node;
    },

    /**
     * Returns a synced controller group which fires a load event once all modules have loaded
     * {ModuleController|NodeController} [arguments] - list of module controllers or node controllers to synchronize
     * @return SyncedControllerGroup.prototype
     */
    sync:function() {

        var group = Object.create(SyncedControllerGroup.prototype);

        // test if user passed an array instead of separate arguments
        if (arguments.length == 1 && !arguments.slice) {
            arguments = arguments[0];
        }

        // create synced controller group using passed arguments
        SyncedControllerGroup.apply(group, arguments);

        return group;
    },

    /**
	 * Returns the first Node matching the selector
	 * @param {String} [selector] - Selector to match the nodes to
	 * @param {Document|Element} [context] - Context to search in
	 * @return {Node|null} First matched node or null
	 */
	getNode:function(selector,context) {
		return this._getNodes(selector,context,true);
	},

	/**
	 * Returns all nodes matching the selector
	 * @param {String} [selector] - Optional selector to match the nodes to
	 * @param {Document|Element} [context] - Context to search in
	 * @return {Array} Array containing matched nodes or empty Array
	 */
	getNodes:function(selector,context) {
		return this._getNodes(selector,context);
	},

	/**
	 * Returns one or multiple nodes matching the selector
	 * @param {String} [selector] - Optional selector to match the nodes to
	 * @param {Document|Element} [context] - Context to search in
	 * @param {Boolean} [singleResult] - Optional boolean to only ask one result
	 * @returns {Array|Node|null}
	 * @private
	 */
	_getNodes:function(selector,context,singleResult) {

		// if no query supplied return all nodes
		if (typeof selector === 'undefined' && typeof context === 'undefined') {
			if (singleResult) {
				return this._nodes[0];
			}
			return this._nodes.concat();
		}

		// find matches (done by querying the node for a match)
		var i=0,l=this._nodes.length,results=[],node;
		for (;i<l;i++) {
			node = this._nodes[i];
			if (node.matchesSelector(selector,context)) {
				if (singleResult) {
					return node;
				}
				results.push(node);
			}
		}

		return singleResult ? null : results;
	},

    /**
     * Parses module controller configuration on element and returns array of module controllers
     * @param {Element} element
     * @returns {Array}
     * @private
     */
    _getModuleControllersByElement:function(element) {

        var controllers = [],
            config = element.getAttribute('data-module') || '',

        // test if first character is a '[', if so multiple modules have been defined
        multiple = config.charCodeAt(0) === 91;

        if (multiple) {

            var specs;

            // add multiple module adapters
            try {
                specs = JSON.parse(config);
            }
            catch(e) {
                // failed parsing spec
                throw new Error('ModuleLoader.load(context): "data-module" attribute contains a malformed JSON string.');
            }

            // no specification found or specification parsing failed
            if (!specs) {
                return [];
            }

            // setup vars
            var l=specs.length,i=0,spec;

            // create specs
            for (;i<l;i++) {

                spec = specs[i];

                controllers.push(
                    new ModuleController(spec.path,element,{
                        'conditions':spec.conditions,
                        'options':spec.options
                    })
                );
            }
        }
        else if (config.length) {

            controllers.push(
                new ModuleController(config,element,{
                    'conditions':element.getAttribute('data-conditions'),
                    'options':element.getAttribute('data-options')
                })
            );

        }

        return controllers;
    }

};