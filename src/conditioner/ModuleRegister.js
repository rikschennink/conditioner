/**
 * @namespace ModuleRegister
 */
var ModuleRegister = {

	_modules:{},

	/**
	 * Register a module
	 * @param {String} path - path to module
	 * @param {Object} config - configuration to setup for module
	 * @param {String} alias - alias name for module
	 * @static
	 */
	registerModule:function(path,config,alias) {

		var key=alias||path,map,conf;

		// setup module entry
		this._modules[key] = {};

		// check if has config defined
		if (config) {

			// set config entry
			this._modules[key].config = config;

			// update requirejs
			conf = {};
			conf[path] = config;
			requirejs.config({
				config:conf
			});

		}

		// check if has alias defined
		if (alias) {

			// set alias entry
			this._modules[key].alias = alias;

			// update requirejs config
			map = {};
			map[alias] = path;
			requirejs.config({
				map:{
					'*':map
				}
			});
		}
	},

	/**
	 * Get a registered module by path
	 * @param {String} path - path to module
	 * @return {Object} - module specification object
	 * @static
	 */
	getModuleByPath:function(path) {

		// if no id supplied throw error
		if (!path) {
			throw new Error('ModuleRegister.getModuleById(path): "path" is a required parameter.');
		}

		return this._modules[path];

	}

};