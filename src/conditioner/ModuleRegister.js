var ModuleRegister = {

	//_modules:{},


    _options:{},
    _redirects:{},


	/**
	 * Register a module
	 * @param {String} path - path to module
	 * @param {Object} options - configuration to setup for module
	 * @param {String} alias - alias name for module
	 * @static
	 */
	registerModule:function(path,options,alias) {

        var uri = requirejs.toUrl(path);
        this._options[uri] = options;

        if (alias) {
            this._redirects[alias] = path;
        }

        var conf = {};
        conf[path] = options;
        requirejs.config({
            config:conf
        });

        /*

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
		*/
	},

    /**
     * Returns the actual path if the path turns out to be a redirect
     * @param path
     * @returns {*}
     */
    getRedirectedPath:function(path) {
        return this._redirects[path] || path;
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

        return this._options[path] || this._options[requirejs.toUrl(path)];

		//return this._modules[path];

	}

};