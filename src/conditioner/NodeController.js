var NodeController = (function(){

    var _filterIsActiveModule = function(item){return item.isModuleActive();};
    var _filterIsAvailableModule = function(item){return item.isModuleAvailable();};
    var _mapModuleToPath = function(item){return item.getModulePath();};

    /**
     * @class
     * @constructor
     * @param {Object} element
     * @param {Number} priority
     */
    var exports = function NodeController(element,priority) {

        if (!element) {
            throw new Error('NodeController(element): "element" is a required parameter.');
        }

        // set element reference
        this._element = element;

        // has been processed
        this._element.setAttribute('data-processed','true');

        // set priority
        this._priority = !priority ? 0 : parseInt(priority,10);

        // contains references to all module controllers
        this._moduleControllers = [];

        // binds
        this._moduleAvailableBind = this._onModuleAvailable.bind(this);
        this._moduleLoadBind = this._onModuleLoad.bind(this);
        this._moduleUnloadBind = this._onModuleUnload.bind(this);

    };

    /**
     * Static method testing if the current element has been processed already
     * @param {Element} element
     * @static
     */
    exports.hasProcessed = function(element) {
        return element.getAttribute('data-processed') === 'true';
    };

    exports.prototype = {

        /**
         * Loads the passed module controllers to the node
         * @param {...} arguments
         * @public
         */
        load:function() {

            // if no module controllers found
            if (!arguments || !arguments.length) {
                throw new Error('NodeController.load(controllers): Expects an array of module controllers as parameters.');
            }

            // turn into array
            this._moduleControllers = Array.prototype.slice.call(arguments,0);

            // listen to load events on module controllers
            var i=0,l=this._moduleControllers.length,mc;
            for (;i<l;i++) {
                mc = this._moduleControllers[i];
                Observer.subscribe(mc,'available',this._moduleAvailableBind);
                Observer.subscribe(mc,'load',this._moduleLoadBind);
            }

        },

        /**
         * Unload all attached modules and restore node in original state
         * @public
         */
        destroy:function() {

            var i=0,l=this._moduleControllers.length;
            for (;i<l;i++) {
                this._destroyModuleController(this._moduleControllers[i]);
            }

            // reset array
            this._moduleControllers = [];

            // update initialized state
            this._updateAttribute('initialized',this._moduleControllers);

            // reset processed state
            this._element.removeAttribute('data-processed');

            // reset element reference
            this._element = null;
        },

        /**
         * Call destroy method on module controller and clean up listeners
         * @param moduleController
         * @private
         */
        _destroyModuleController:function(moduleController) {

            // unsubscribe from module events
            Observer.unsubscribe(moduleController,'available',this._moduleAvailableBind);
            Observer.unsubscribe(moduleController,'load',this._moduleLoadBind);
            Observer.unsubscribe(moduleController,'unload',this._moduleUnloadBind);

            // conceal events from module controller
            Observer.conceal(moduleController,this);

            // unload the controller
            moduleController.destroy();

        },

        /**
         * Returns the set priority for this node
         * @public
         */
        getPriority:function() {
            return this._priority;
        },

        /**
         * Returns the element linked to this node
         * @public
         */
        getElement:function() {
            return this._element;
        },

        /**
         * Public method to check if the module matches the given query
         * @param {String} selector - CSS selector to match module to
         * @param {Document|Element} [context] - Context to search in
         * @return {Boolean}
         * @public
         */
        matchesSelector:function(selector,context) {
            if (context && !contains(context,this._element)) {
                return false;
            }
            return matchesSelector(this._element,selector,context);
        },

        /**
         * Returns true if all module controllers are active
         * @public
         */
        areAllModulesActive:function() {
            return this.getActiveModuleControllers().length === this._moduleControllers.length;
        },

        /**
         * Returns an array containing all active module controllers
         * @return {Array}
         * @public
         */
        getActiveModuleControllers:function() {
            return this._moduleControllers.filter(_filterIsActiveModule);
        },

        /**
         * Returns the first ModuleController matching the given path
         * @param {String} [path] to module
         * @return {ModuleController|null}
         * @public
         */
        getModuleController:function(path) {
            return this._getModuleControllers(path,true);
        },

        /**
         * Returns an array of ModuleControllers matching the given path
         * @param {String} [path] to module
         * @return {Array}
         * @public
         */
        getModuleControllers:function(path) {
            return this._getModuleControllers(path);
        },

        /**
         * Returns one or multiple ModuleControllers matching the supplied path
         * @param {String} [path] - Optional path to match the nodes to
         * @param {Boolean} [singleResult] - Optional boolean to only ask for one result
         * @returns {Array|ModuleController|null}
         * @private
         */
        _getModuleControllers:function(path,singleResult) {

            // if no path supplied return all module controllers (or one if single result mode)
            if (typeof path === 'undefined') {
                if (singleResult) {
                    return this._moduleControllers[0];
                }
                return this._moduleControllers.concat();
            }

            // loop over module controllers matching the path, if single result is enabled, return on first hit, else collect
            var i=0,l=this._moduleControllers.length,results=[],mc;
            for (;i<l;i++) {
                mc = this._moduleControllers[i];
                if (!mc.matchesPath(path)) {
                    continue;
                }
                if (singleResult) {
                    return mc;
                }
                results.push(mc);
            }
            return singleResult ? null : results;
        },

        /**
         * Public method for safely attempting method execution on modules
         * @param {String} method - method key
         * @param {Array} [params] - array containing the method parameters
         * @return [Array] returns object containing status code and possible response data
         * @public
         */
        execute:function(method,params) {
            return this._moduleControllers.map(function(item){
                return {
                    controller:item,
                    result:item.execute(method,params)
                };
            });
        },

        /**
         * Called when a module becomes available for load
         * @param moduleController
         * @private
         */
        _onModuleAvailable:function(moduleController) {

            // propagate events from the module controller to the node so people can subscribe to events on the node
            Observer.inform(moduleController,this);

            // update loading attribute with currently loading module controllers list
            this._updateAttribute('loading',this._moduleControllers.filter(_filterIsAvailableModule));
        },

        /**
         * Called when module has loaded
         * @param moduleController
         * @private
         */
        _onModuleLoad:function(moduleController) {

            // listen to unload event
            Observer.unsubscribe(moduleController,'load',this._moduleLoadBind);
            Observer.subscribe(moduleController,'unload',this._moduleUnloadBind);

            // update loading attribute with currently loading module controllers list
            this._updateAttribute('loading',this._moduleControllers.filter(_filterIsAvailableModule));

            // update initialized attribute with currently active module controllers list
            this._updateAttribute('initialized',this.getActiveModuleControllers());
        },

        /**
         * Called when module has unloaded
         * @param moduleController
         * @private
         */
        _onModuleUnload:function(moduleController) {

            // stop listening to unload
            Observer.subscribe(moduleController,'load',this._moduleLoadBind);
            Observer.unsubscribe(moduleController,'unload',this._moduleUnloadBind);

            // conceal events from module controller
            Observer.conceal(moduleController,this);

            // update initialized attribute with now active module controllers list
            this._updateAttribute('initialized',this.getActiveModuleControllers());
        },

        /**
         * Updates the given attribute with paths of the supplied controllers
         * @private
         */
        _updateAttribute:function(attr,controllers) {
            var modules = controllers.map(_mapModuleToPath);
            if (modules.length) {
                this._element.setAttribute('data-' + attr,modules.join(','));
            }
            else {
                this._element.removeAttribute('data-' + attr);
            }
        }

    };

    return exports;

}());