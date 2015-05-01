(function(win,undefined) {

	'use strict';

	// returns conditioner API
	var factory = function(require,Observer,Promise,contains,matchesSelector,mergeObjects) {

		// private vars
		var _options;
		var _monitorFactory;
		var _moduleLoader;

		// internal modules
		// FACTORY <%= contents %>

		// conditioner options object
		_options = {
			'paths':{
				'monitors':'./monitors/'
			},
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
				'require':function(paths,callback) {
					require(paths,callback);
				},
				'config':function(path,options) {
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

		// setup monitor factory
		_monitorFactory = new MonitorFactory();

		// setup loader instance
		_moduleLoader =  new ModuleLoader();

		/***
		 * Call `[init](#conditioner-init)` on the `conditioner` object to start loading the referenced modules in the HTML document. Once this is done the conditioner will return the nodes it found as an Array and will initialize them automatically once they are ready.
		 *
		 * Each node is wrapped in a [NodeController](#nodecontroller) which contains one or more [ModuleControllers](#modulecontroller).
		 *
		 * @exports Conditioner
		 */
		return {

			/***
			 * Call this method to start parsing the document for modules. Conditioner will initialize all found modules and return an Array containing the newly found nodes.
			 *
			 * ```js
			 * require(['conditioner'],function(conditioner){
			 *
			 *     conditioner.init();
			 *
			 * });
			 * ```
			 *
			 * @method init
			 * @memberof Conditioner
			 * @param {Object=} options - Options to override.
			 * @returns {Array} nodes - Array of initialized nodes.
			 * @public
			 */
			init:function(options) {

				if (options) {
					this.setOptions(options);
				}

				return _moduleLoader.parse(win.document);

			},

			/***
			 * Allows defining page level Module options, shortcuts to modules, and overrides for conditioners inner workings.
			 *
			 * Passing the default options object.
			 * ```js
			 * require(['conditioner'],function(conditioner){
			 *
			 *     conditioner.setOptions({
			 *
			 *         // Page level module options
			 *         modules:{},
			 *
			 *         // Path overrides
			 *         paths:{
			 *             monitors:'./monitors/'
			 *         },
			 *
			 *         // Attribute overrides
			 *         attr:{
			 *             options:'data-options',
			 *             module:'data-module',
			 *             conditions:'data-conditions',
			 *             priority:'data-priority',
			 *             initialized:'data-initialized',
			 *             processed:'data-processed',
			 *             loading:'data-loading'
			 *         },
			 *
			 *         // AMD loader overrides
			 *         loader:{
			 *             require:function(paths,callback){
			 *                 require(paths,callback)
			 *             },
			 *             config:function(path,options){
			 *                 var config = {};
			 *                 config[path] = options;
			 *                 requirejs.config({
			 *                     config:config
			 *                 });
			 *             },
			 *             toUrl:function(path){
			 *                 return requirejs.toUrl(path)
			 *             }
			 *         }
			 *     });
			 *
			 * });
			 * ```
			 *
			 * @method setOptions
			 * @memberof Conditioner
			 * @param {Object} options - Options to override.
			 * @public
			 */
			setOptions:function(options) {

				// @ifdef DEV
				if (!options) {
					throw new Error('Conditioner.setOptions(options): "options" is a required parameter.');
				}
				// @endif

				var config;
				var path;
				var mod;
				var alias;
				var enabled;

				// update options
				_options = mergeObjects(_options,options);

				// fix paths if not ending with slash
				for (path in _options.paths) {

					/* istanbul ignore next */
					if (!_options.paths.hasOwnProperty(path)) {continue;}

					// add slash if path does not end on slash already
					_options.paths[path] += _options.paths[path].slice(-1) !== '/' ? '/' : '';
				}

				// loop over modules
				for (path in _options.modules) {

					/* istanbul ignore next */
					if (!_options.modules.hasOwnProperty(path)) {continue;}

					// get module reference
					mod = _options.modules[path];

					// get alias
					alias = typeof mod === 'string' ? mod : mod.alias;

					// get config
					config = typeof mod === 'string' ? null : mod.options || {};

					// get result of requirements
					enabled = typeof mod === 'string' ? null : mod.enabled;

					// register this module
					ModuleRegistry.registerModule(path,config,alias,enabled);

				}

			},

			/***
			 * Finds and loads all Modules defined on child elements of the supplied context. Returns an Array of found Nodes.
			 *
			 * @method parse
			 * @memberof Conditioner
			 * @param {Element} context - Context to find modules in.
			 * @returns {Array} nodes - Array of initialized nodes.
			 */
			parse:function(context) {

				// @ifdef DEV
				if (!context) {
					throw new Error('Conditioner.parse(context): "context" is a required parameter.');
				}
				// @endif

				return _moduleLoader.parse(context);

			},

			/***
			 * Creates a [NodeController](#nodecontroller) based on the passed element and set of controllers.
			 *
			 * ```js
			 * require(['conditioner'],function(conditioner){
			 *
			 *     // find a suitable element
			 *     var foo = document.getElementById('foo');
			 *
			 *     // load Clock module to foo element
			 *     conditioner.load(foo,[
			 *         {
			 *             path: 'ui/Clock',
			 *             conditions: 'media:{(min-width:30em)}',
			 *             options: {
			 *                 time:false
			 *             }
			 *         }
			 *     ]);
			 *
			 * });
			 * ```
			 *
			 * @method load
			 * @memberof Conditioner
			 * @param {Element} element - Element to bind the controllers to.
			 * @param {(Array|ModuleController)} controllers - [ModuleController](#modulecontroller) configurations.
			 * @returns {(NodeController|null)} node - The newly created node or null if something went wrong.
			 */
			load:function(element,controllers) {

				return _moduleLoader.load(element,controllers);

			},

			/***
			 * Wraps the supplied controllers in a [SyncedControllerGroup](#syncedcontrollergroup) which will fire a load event when all of the supplied modules have loaded.
			 *
			 * ```js
			 * require(['conditioner','Observer'],function(conditioner,Observer){
			 *
			 *     // Find period element on the page
			 *     var periodElement = document.querySelector('.peroid');
			 *
			 *     // Initialize all datepicker modules
			 *     // within the period element
			 *     var datePickerNodes = conditioner.parse(periodElement);
			 *
			 *     // Synchronize load events, we only want to work
			 *     // with these modules if they are all loaded
			 *     var syncGroup = conditioner.sync(datePickerNodes);
			 *
			 *     // Wait for load event to fire
			 *     Observer.subscribe(syncGroup,'load',function(nodes){
			 *
			 *         // All modules now loaded
			 *
			 *     });
			 *
			 *     // Also listen for unload event
			 *     Observer.subscribe(syncGroup,'unload',function(nodes){
			 *
			 *         // One of the modules has unloaded
			 *
			 *     });
			 *
			 * });
			 * ```
			 *
			 * @method sync
			 * @memberof Conditioner
			 * @param {(ModuleController|NodeController)} arguments - List of [ModuleControllers](#modulecontroller) or [NodeControllers](#nodecontroller) to synchronize.
			 * @returns {SyncedControllerGroup} syncedControllerGroup - A [SyncedControllerGroup](#syncedcontrollergroup).
			 */
			sync:function() {

				var group = Object.create(SyncedControllerGroup.prototype);

				// create synced controller group using passed arguments
				// test if user passed an array instead of separate arguments
				SyncedControllerGroup.apply(
					group,
					[arguments[0].slice ? arguments[0] : Array.prototype.slice.call(arguments, 0)]
				);

				return group;

			},

			/***
			 * Returns the first [NodeController](#nodecontroller) matching the given selector within the passed context
			 *
			 * - `getNode(element)` return the NodeController bound to this element
			 * - `getNode(selector)` return the first NodeController found with given selector
			 * - `getNode(selector,context)` return the first NodeController found with selector within given context
			 *
			 * @method getNode
			 * @memberof Conditioner
			 * @param {...*=} arguments - See description.
			 * @returns {(NodeController|null)} node - First matched node or null.
			 */
			getNode:function() {

				// if first param is element return the node on that element only
				if (typeof arguments[0] === 'object') {
					return _moduleLoader.getNodeByElement(arguments[0]);
				}

				// return nodes found with supplied parameters
				return _moduleLoader.getNodes(arguments[0],arguments[1],true);

			},

			/***
			 * Returns all [NodeControllers](#nodecontroller) matching the given selector with the passed context
			 *
			 * @method getNodes
			 * @memberof Conditioner
			 * @param {String=} selector - Selector to match the nodes to.
			 * @param {Element=} context - Context to search in.
			 * @returns {Array} nodes -  Array containing matched nodes or empty Array.
			 */
			getNodes:function(selector,context) {

				return _moduleLoader.getNodes(selector,context,false);

			},

			/***
			 * Destroy matched [NodeControllers](#nodecontroller) based on the supplied parameters.
			 *
			 * @method destroy
			 * @memberof Conditioner
			 * @param {(NodeController|String|Array)} arguments - Destroy a single node controller, matched elements or an Array of NodeControllers.
			 * @returns {Boolean} state - Were all nodes destroyed successfuly
			 * @public
			 */
			destroy:function() {

				var nodes = [];
				var arg = arguments[0];

				// @ifdef DEV
				// first argument is required
				if (!arg) {
					throw new Error('Conditioner.destroy(...): A DOM node, Array, String or NodeController is required as the first argument.');
				}
				// @endif

				// test if is an array
				if (Array.isArray(arg)) {
					nodes = arg;
				}

				// test if is query selector
				if (typeof arg === 'string') {
					nodes = _moduleLoader.getNodes(arg,arguments[1]);
				}

				// test if is single NodeController instance
				else if (arg instanceof NodeController) {
					nodes.push(arg);
				}

				// test if is DOMNode
				else if (arg.nodeName) {
					nodes = _moduleLoader.getNodes().filter(function(node) {
						return contains(arg,node.getElement());
					});
				}

				// if we don't have any nodes to destroy let's stop here
				if (nodes.length === 0) {
					return false;
				}

				return _moduleLoader.destroy(nodes);
			},

			/***
			 * Returns the first [ModuleController](#modulecontroller) matching the supplied query.
			 *
			 * - `getModule(element)` get module on the given element
			 * - `getModule(element, path)` get module with path on the given element
			 * - `getModule(path)` get first module with given path
			 * - `getModule(path, filter)` get first module with path in document scope
			 * - `getModule(path, context)` get module with path, search within conetxt subtree
			 * - `getModule(path, filter, context)` get module with path, search within matched elements in context
			 *
			 * @method getModule
			 * @memberof Conditioner
			 * @param {...*=} arguments - See description.
			 * @returns {(ModuleController|null)} module - The found module.
			 * @public
			 */
			getModule:function() {

				var i;
				var path;
				var filter;
				var context;
				var results;
				var l;
				var node;
				var module;

				// if the first argument is an element we are testing this element only, not it's subtree
				// the second argument could either be 'undefined' or a 'path'
				if (typeof arguments[0] === 'object') {

					// find the element and get the correct module by path (if set)
					node = _moduleLoader.getNodeByElement(arguments[0]);

					// get module controller
					return node ? node.getModule(arguments[1]) : null;
				}

				// if first argument is not an element, it is expected to be a module path
				path = arguments[0];

				// argument two could be a context or a filter depending on type
				if (typeof arguments[1] === 'string') {
					filter = arguments[1];
					context = arguments[2];
				}
				else {
					context = arguments[1];
				}

				i = 0;
				results = _moduleLoader.getNodes(filter,context,false);
				l = results.length;

				for (;i < l;i++) {
					module = results[i].getModule(path);
					if (module) {
						return module;
					}
				}

				return null;
			},

			/***
			 * Returns all [ModuleControllers](#modulecontroller) matching the given path within the supplied context.
			 *
			 * - `getModules(element)` get modules on the given element
			 * - `getModules(element, path)` get modules with path on the given element
			 * - `getModules(path)` get modules with given path
			 * - `getModules(path, filter)` get modules with path in document scope
			 * - `getModules(path, context)` get modules with path, search within element subtree
			 * - `getModules(path, filter, context)` get modules with path, search within matched elements in context
			 *
			 * @method getModules
			 * @memberof Conditioner
			 * @param {...*=} arguments - See description.
			 * @returns {(Array|null)} modules - The found modules.
			 * @public
			 */
			getModules:function() {

				var i;
				var path;
				var filter;
				var context;
				var results;
				var l;
				var node;
				var modules;
				var filtered;

				// if the first argument is an element we are testing this element only, not it's subtree
				// the second argument could either be 'undefined' or a 'path'
				if (typeof arguments[0] === 'object') {

					// find the element and get the correct module by path (if set)
					node = _moduleLoader.getNodeByElement(arguments[0]);

					// get module controllers
					return node.getModules(arguments[1]);
				}

				// if first argument is not an element, it is expected to be a module path
				path = arguments[0];

				// argument two could be a context or a filter depending on type
				if (typeof arguments[1] === 'string') {
					filter = arguments[1];
					context = arguments[2];
				}
				else {
					context = arguments[1];
				}

				i = 0;
				results = this.getNodes(filter,context);
				l = results.length;
				filtered = [];

				for (;i < l;i++) {
					modules = results[i].getModules(path);
					if (modules.length) {
						filtered = filtered.concat(modules);
					}
				}

				return filtered;

			},

			/***
			 * Manually test an expression, only returns once via promise with a `true` or `false` state
			 *
			 * ```js
			 * require(['conditioner'],function(conditioner){
			 *
			 *     // Test if supplied condition is valid
			 *     conditioner.is('window:{min-width:500}').then(function(state){
			 *
			 *         // State equals true if window has a
			 *         // minimum width of 500 pixels.
			 *
			 *     });
			 *
			 * });
			 * ```
			 *
			 * @method is
			 * @memberof Conditioner
			 * @param {String} condition - Expression to test.
			 * @param {Element=} element - Element to run the test on.
			 * @returns {Promise}
			 */
			is:function(condition,element) {

				// @ifdef DEV
				if (!condition) {
					throw new Error('Conditioner.is(condition,[element]): "condition" is a required parameter.');
				}
				// @endif

				// run test and resolve with first received state
				var p = new Promise();
				WebContext.setTest(condition,element,function(valid) {
					p.resolve(valid);
				});
				return p;

			},

			/***
			 * Manually test an expression, bind a callback method to be executed once something changes.
			 *
			 * ```js
			 * require(['conditioner'],function(conditioner){
			 *
			 *     // Test if supplied condition is valid
			 *     conditioner.on('window:{min-width:500}',function(state){
			 *
			 *         // State equals true if window a
			 *         // has minimum width of 500 pixels.
			 *
			 *         // If the window is resized this method
			 *         // is called with the new state.
			 *
			 *     });
			 *
			 * });
			 * ```
			 *
			 * @method on
			 * @memberof Conditioner
			 * @param {String} condition - Expression to test.
			 * @param {(Element|Function)=} element - Optional element to run the test on.
			 * @param {Function=} callback - Callback method.
			 */
			on:function(condition,element,callback) {

				// @ifdef DEV
				if (!condition) {
					throw new Error('Conditioner.on(condition,[element],callback): "condition" and "callback" are required parameter.');
				}
				// @endif

				// handle optional element parameter
				callback = typeof element === 'function' ? element : callback;

				// run test and execute callback on change
				WebContext.setTest(condition,element,function(valid) {
					callback(valid);
				});

			}

		};

	};

	// CommonJS
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory(
			require,
			require('./utils/Observer'),
			require('./utils/Promise'),
			require('./utils/contains'),
			require('./utils/matchesSelector'),
			require('./utils/mergeObjects')
		);
	}
	// AMD
	else if (typeof define === 'function' && define.amd) {
		define([
			'require',
			'./utils/Observer',
			'./utils/Promise',
			'./utils/contains',
			'./utils/matchesSelector',
			'./utils/mergeObjects'
		],factory);
	}
	// Browser globals
	else {
		// @ifdef DEV
		throw new Error('To use ConditionerJS you need to setup an AMD module loader or use something like Browserify.');
		// @endif
	}

}(this));