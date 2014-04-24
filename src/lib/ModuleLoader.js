/**
 * @exports ModuleLoader
 * @class
 * @constructor
 */
var ModuleLoader = function() {

	// array of all parsed nodes
	this._nodes = [];

};

ModuleLoader.prototype = {

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
            node,
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
			nodes.push(new NodeController(element,element.getAttribute(_options.attr.priority)));
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
            node = nodes[i];
			node.load.apply(node,this._getModuleControllersByElement(node.getElement()));
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
                this._getModuleController(controller.path,element,controller.options,controller.conditions)
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
     * Destroy the passed node reference
     * @param node {NodeController}
     * @return {Boolean}
     * @public
     */
    destroyNode:function(node){
        var i=this._nodes.length;
        while(i--) {
            if (this._nodes[i]!==node) {continue;}
            this._nodes.splice(i,1);
            node.destroy();
            return true;
        }
        return false;
    },

	/**
	 * Returns one or multiple nodes matching the selector
	 * @param {String} [selector] - Optional selector to match the nodes to
	 * @param {Document|Element} [context] - Context to search in
	 * @param {Boolean} [singleResult] - Optional boolean to only ask one result
	 * @returns {Array|Node|null}
	 * @public
	 */
	getNodes:function(selector,context,singleResult) {

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
            config = element.getAttribute(_options.attr.module) || '',
            i= 0,
            specs,spec,l,

        // test if first character is a '[', if so multiple modules have been defined
        multiple = config.charCodeAt(0) === 91;

        if (multiple) {

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
            l=specs.length;

            // create specs
            for (;i<l;i++) {
                spec = specs[i];
                controllers.push(
                    this._getModuleController(spec.path,element,spec.options,spec.conditions)
                );
            }
        }
        else if (config.length) {
            controllers.push(
                this._getModuleController(config,element,element.getAttribute(_options.attr.options),element.getAttribute(_options.attr.conditions))
            );
        }

        return controllers;
    },

    /**
     * Module Controller factory method, creates different ModuleControllers based on params
     * @param path - path of module
     * @param element - element to attach module to
     * @param options - options for module
     * @param conditions - conditions required for module to be loaded
     * @returns {ModuleController}
     * @private
     */
    _getModuleController:function(path,element,options,conditions) {
        return new ModuleController(
            path,
            element,
            options,
            conditions ? new ConditionModuleAgent(conditions,element) : StaticModuleAgent
        );
    }

};