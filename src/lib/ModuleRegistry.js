var ModuleRegistry = {

	_options:{},
	_redirects:{},
	_enabled:{},

	/**
	 * Register a module
	 * @param {String} path - path to module
	 * @param {Object} options - configuration to setup for module
	 * @param {String} alias - alias name for module
	 * @param {Boolean} enabled - true/false if the module is enabled, null if -don't care-
	 * @static
	 */
	registerModule:function(path,options,alias,enabled) {

		// remember options for absolute path
		this._options[_options.loader.toUrl(path)] = options;

		// remember if module is supported
		this._enabled[path] = enabled;

		// setup redirect from alias
		if (alias) {
			this._redirects[alias] = path;
		}

		// pass configuration to loader
		_options.loader.config(path,options);
	},

	/**
	 * Returns if the given module is enabled
	 * @param {String} path - path to module
	 * @static
	 */
	isModuleEnabled:function(path) {
		return this._enabled[path] !== false;
	},

	/**
	 * Returns the actual path if the path turns out to be a redirect
	 * @param path
	 * @returns {*}
	 */
	getRedirect:function(path) {
		return this._redirects[path] || path;
	},

	/**
	 * Get a registered module by path
	 * @param {String} path - path to module
	 * @return {Object} - module specification object
	 * @static
	 */
	getModule:function(path) {

		// @ifdef DEV
		// if no id supplied throw error
		if (!path) {
			throw new Error('ModuleRegistry.getModule(path): "path" is a required parameter.');
		}
		// @endif

		return this._options[path] || this._options[_options.loader.toUrl(path)];

	}

};