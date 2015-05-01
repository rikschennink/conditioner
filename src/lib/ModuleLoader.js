var _jsonRegExp = new RegExp('^\\[\\s*{','gm');

/**
 * @exports ModuleLoader
 * @class
 * @constructor
 */
var ModuleLoader = function ModuleLoader() {

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

		// @ifdef DEV
		if (!context) {
			throw new Error('ModuleLoader.loadModules(context): "context" is a required parameter.');
		}
		// @endif

		// register vars and get elements
		var elements = context.querySelectorAll('[data-module]');
		var	l = elements.length;
		var	i = 0;
		var	nodes = [];
		var	node;
		var	element;

		// if no elements do nothing
		if (!elements) {
			return [];
		}

		// process elements
		for (; i < l; i++) {

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
		nodes.sort(function(a,b) {
			return a.getPriority() - b.getPriority();
		});

		// initialize modules depending on assigned priority (in reverse, but priority is reversed as well so all is okay)
		i = nodes.length;
		while (--i >= 0) {
			node = nodes[i];
			node.load.call(node,this._getModuleControllersByElement(node.getElement()));
		}

		// merge new nodes with currently active nodes list
		this._nodes = this._nodes.concat(nodes);

		// returns nodes so it is possible to later unload nodes manually if necessary
		return nodes;
	},

	/**
	 * Setup the given element with the passed module controller(s)
	 * [
	 *     {
	 *         path: 'path/to/module',
	 *         conditions: 'config',
	 *         options: {
	 *             foo: 'bar'
	 *         }
	 *     }
	 * ]
	 * @param {Element} element - Element to bind the controllers to
	 * @param {Array|Object} controllers - ModuleController configurations
	 * @return {NodeController|null} - The newly created node or null if something went wrong
	 */
	load:function(element,controllers) {

		// @ifdef DEV
		if (!controllers) {
			throw new Error('ModuleLoader.load(element,controllers): "controllers" is a required parameter.');
		}
		// @endif

		// if controllers is object put in array
		controllers = controllers.length ? controllers : [controllers];

		// vars
		var i = 0;
		var l = controllers.length;
		var moduleControllers = [];
		var controller;
		var node;

		// create node
		node = new NodeController(element);

		// create controllers
		for (;i < l;i++) {
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
	 * Returns the node matching the given element
	 * @param {Element} element - element to match to
	 * @param {Boolean} [singleResult] - Optional boolean to only ask one result
	 * @returns {Array|Node|null}
	 * @public
	 */
	getNodeByElement:function(element) {

		var i = 0;
		var l = this._nodes.length;
		var node;

		for (;i < l;i++) {
			node = this._nodes[i];
			if (node.getElement() === element) {
				return node;
			}
		}

		return null;
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
		var i = 0;
		var l = this._nodes.length;
		var results = [];
		var node;

		for (;i < l;i++) {
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
	 * Destroy the passed node reference
	 * @param {Array} nodes
	 * @return {Boolean}
	 * @public
	 */
	destroy:function(nodes) {

		var i = nodes.length;
		var	destroyed = 0;
		var	hit;

		while (i--) {

			hit = this._nodes.indexOf(nodes[i]);
			if (hit === -1) {continue;}

			this._nodes.splice(hit,1);
			nodes[i].destroy();
			destroyed++;

		}

		return nodes.length === destroyed;
	},

	/**
	 * Parses module controller configuration on element and returns array of module controllers
	 * @param {Element} element
	 * @returns {Array}
	 * @private
	 */
	_getModuleControllersByElement:function(element) {

		var config = element.getAttribute(_options.attr.module) || '';

		// test if first character is a '[', if so multiple modules have been defined
		// double comparison is faster than triple in this case
		if (config.charCodeAt(0) == 91) {

			var controllers = [];
			var	i = 0;
			var l;
			var	specs;
			var spec;

			// add multiple module adapters
			try {
				specs = JSON.parse(config);
			}
			catch(e) {
				// @ifdef DEV
				throw new Error('ModuleLoader.load(context): "data-module" attribute contains a malformed JSON string.');
				// @endif
			}

			// no specification found or specification parsing failed
			if (!specs) {
				return [];
			}

			// setup vars
			l = specs.length;

			// test if is json format
			if (_jsonRegExp.test(config)) {
				for (;i < l;i++) {
					spec = specs[i];

					if (!ModuleRegistry.isModuleEnabled(spec.path)) {continue;}

					controllers[i] = this._getModuleController(
						spec.path,
						element,
						spec.options,
						spec.conditions
					);
				}
				return controllers;
			}

			// expect array format
			for (;i < l;i++) {
				spec = specs[i];

				if (!ModuleRegistry.isModuleEnabled(typeof spec == 'string' ? spec : spec[0])) {continue;}

				if (typeof spec == 'string') {
					controllers[i] = this._getModuleController(spec,element);
				}
				else {
					controllers[i] = this._getModuleController(
						spec[0],
						element,
						typeof spec[1] == 'string' ? spec[2] : spec[1],
						typeof spec[1] == 'string' ? spec[1] : spec[2]
					);
				}
			}
			return controllers;

		}

		// no support, no module
		if (!ModuleRegistry.isModuleEnabled(config)) {return null;}

		// support, so let's get the module controller
		return [this._getModuleController(
			config,
			element,
			element.getAttribute(_options.attr.options),
			element.getAttribute(_options.attr.conditions)
		)];
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