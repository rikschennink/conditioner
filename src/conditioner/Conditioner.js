/**
 * @exports Conditioner
 * @class
 * @constructor
 */
var Conditioner = function() {

	// options for conditioner
	this._options = {
		'modules':{}
	};

	// array of all parsed nodes
	this._nodes = [];

	/**
	 * Reference to Observer object
	 * @property {Observer}
	 */
	this.Observer = Observer;

	/**
	 * Reference to mergeObject method
	 * @property {Function} mergeObjects
	 */
	this.mergeObjects = Utils.mergeObjects;
};

Conditioner.prototype = {

	/**
	 * Set custom options
	 * @param {Object} options - options to override
	 * @public
	 */
	setOptions:function(options) {

		if (!options) {
			throw new Error('Conditioner.setOptions(options): "options" is a required parameter.');
		}

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
	 * @param {Element} context - Context to find modules in
	 * @return {Array} - Array of found Nodes
	 */
	loadModules:function(context) {

		// if no context supplied throw error
		if (!context) {
			throw new Error('Conditioner.loadModules(context): "context" is a required parameter.');
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
		// - (it's actually the other way around but that's because of the reversed while loop)
		nodes.sort(function(a,b){
			return a.getPriority() - b.getPriority();
		});

		// initialize modules depending on assigned priority (in reverse, but priority is reversed as well so all is okay)
		i = nodes.length;
		while (--i >= 0) {
			nodes[i].init();
		}

		// merge new nodes with currently active nodes list
		this._nodes = this._nodes.concat(nodes);

		// returns nodes so it is possible to later unload nodes manually if necessary
		return nodes;
	},

	/**
	 * Returns the first Node matching the selector
	 * @param {String} selector - Selector to match the nodes to
	 * @return {Node} First matched node
	 */
	getNode:function(selector) {
		return this.getNodesAll(selector)[0];
	},

	/**
	 * Returns all nodes matching the selector
	 * @param {String} selector - Optional selector to match the nodes to
	 * @return {Array} Array containing matched nodes
	 */
	getNodesAll:function(selector) {

		// if no query supplied return all nodes
		if (typeof selector === 'undefined') {
			return this._nodes.concat();
		}

		// find matches (done by querying the node for a match)
		var i=0,l = this._nodes.length,results=[],node;
		for (;i<l;i++) {
			node = this._nodes[i];
			if (node.matchesSelector(selector)) {
				results.push(node);
			}
		}

		return results;
	}

};