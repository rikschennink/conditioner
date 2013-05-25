/**
 * @exports Node
 * @class
 * @constructor
 * @param {element} element
 */
var Node = function(element) {

    if (!element) {
        throw new Error('Node: "element" is a required parameter.');
    }

    // set element reference
    this._element = element;

    // has been processed
    this._element.setAttribute('data-processed','true');

    // set priority
    var prio = this._element.getAttribute('data-priority');
    this._priority = !prio ? 0 : parseInt(prio,10);

    // contains references to all module controllers
    this._moduleControllers = [];

    // contains reference to currently active module controller
    this._activeModuleController = null;

    // method to unbind
    this._activeModuleUnloadBind = this._onActiveModuleUnload.bind(this);

};

/**
 * Static method testing if the current element has been processed already
 * @param {element} element
 * @static
 */
Node.hasProcessed = function(element) {
    return element.getAttribute('data-processed') === 'true';
};

Node.prototype = {

    /**
     * Initializes the node
     * @public
     */
    init:function() {

        // parse element module attributes
        this._moduleControllers = this._createModuleControllers();

        // initialize
        var i=0,l=this._moduleControllers.length,mc;

        // if no module controllers found
        if (!l) {
            throw new Error('Node: "element" has to have a "data-module" attribute containing a reference to a Module.');
        }

        // listen to ready events on module controllers
        for (;i<l;i++) {

            mc = this._moduleControllers[i];

            // if module already ready, jump to _onModuleReady method and don't bind listener
            if (mc.isReady()) {
                this._onModuleReady();
                continue;
            }

            // otherwise, listen to ready event
            Observer.subscribe(mc,'ready',this._onModuleReady.bind(this));
        }
    },

    /**
     * Returns the set priority for this node
     * @public
     */
    getPriority:function() {
        return this._priority;
    },

    /**
     * Public method to check if the module matches the given query
     * @param {string} selector
     * @return {boolean}
     * @public
     */
    matchesSelector:function(selector) {
        return Utils.matchesSelector(this._element,selector);
    },

    /**
     * Returns a reference to the currently active module controller
     * @return {ModuleController}
     * @public
     */
    getActiveModuleController:function() {
        return this._activeModuleController;
    },

    /**
     * Returns the first ModuleController matching the given path
     * @param path {string} path to module
     * @return {ModuleController}
     * @public
     */
    getModuleController:function(path) {
        return this.getModuleControllerAll(path)[0];
    },

    /**
     * Returns an array of ModuleControllers matching the given path
     * @param path {string} path to module
     * @return {Array}
     * @public
     */
    getModuleControllerAll:function(path) {

        if (typeof path === 'undefined') {
            return this._moduleControllers.concat();
        }

        var i=0,l=this._moduleControllers.length,result=[],mc;
        for (;i<l;i++) {
            mc = this._moduleControllers[i];
            if (mc.matchesPath(path)) {
                result.push(mc);
            }
        }
        return result;
    },

    /**
     * Public method for safely executing methods on the loaded module
     * @param {string} method - method key
     * @param {Array} params - array containing the method parameters
     * @return {object} returns object containing status code and possible response data
     * @public
     */
    execute:function(method,params) {

        // if active module controller defined
        if (this._activeModuleController) {
            return this._activeModuleController.execute(method,params);
        }

        // no active module
        return {
            'status':404,
            'response':null
        };
    },

    /**
     * Called when a module has indicated it is ready
     * @private
     */
    _onModuleReady:function() {

        var i=this._moduleControllers.length;

        // check if all modules ready, if so, call on modules ready
        while (--i >= 0) {
            if (!this._moduleControllers[i].isReady()) {
                return;
            }
        }

        // all modules ready
        this._onModulesReady();

    },

    /**
     * Called when all modules are ready
     * @private
     */
    _onModulesReady:function() {

        // find suitable active module controller
        var moduleController = this._getSuitableActiveModuleController();
        if (moduleController) {
            this._setActiveModuleController(moduleController);
        }

        // listen to available events on controllers
        var i=0,l=this._moduleControllers.length;
        for (;i<l;i++) {
            Observer.subscribe(this._moduleControllers[i],'available',this._onModuleAvailable.bind(this));
        }

    },

    /**
     * Called when a module controller has indicated it is ready to be loaded
     * @param moduleController
     * @private
     */
    _onModuleAvailable:function(moduleController) {

        // setup vars
        var i=0,l=this._moduleControllers.length,mc;

        for (;i<l;i++) {

            mc = this._moduleControllers[i];

            if (mc !== moduleController &&
                mc.isAvailable() &&
                mc.isConditioned()) {

                // earlier or conditioned module is ready, therefor cannot load this module

                return;
            }
        }

        // load supplied module controller as active module
        this._setActiveModuleController(moduleController);

    },

    /**
     * Sets the active module controller
     * @param moduleController
     * @private
     */
    _setActiveModuleController:function(moduleController) {

        // if not already loaded
        if (moduleController === this._activeModuleController) {
            return;
        }

        // clean up active module controller reference
        this._cleanActiveModuleController();

        // set new active module controller
        this._activeModuleController = moduleController;
        Observer.subscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);
        this._activeModuleController.load();

    },

    /**
     * Removes the active module controller
     * @private
     */
    _cleanActiveModuleController:function() {

        // if no module controller defined do nothing
        if (!this._activeModuleController) {
            return;
        }

        // stop listening to unload
        Observer.unsubscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);

        // unload controller
        this._activeModuleController.unload();

        // remove reference
        this._activeModuleController = null;
    },

    /**
     * Called when active module unloaded
     * @private
     */
    _onActiveModuleUnload:function() {

        // clean up active module controller reference
        this._cleanActiveModuleController();

        // active module was unloaded, find another active module
        var moduleController = this._getSuitableActiveModuleController();
        if(!moduleController) {
            return;
        }

        // set found module controller as new active module controller
        this._setActiveModuleController(moduleController);
    },

    /**
     * Returns a suitable module controller
     * @returns {null|ModuleController}
     * @private
     */
    _getSuitableActiveModuleController:function() {

        // test if other module is ready, if so load first module to be fitting
        var i=0,l=this._moduleControllers.length,mc;
        for (;i<l;i++) {

            mc = this._moduleControllers[i];

            // if not ready, skip to next controller
            if (!mc.isAvailable()) {
                continue;
            }

            return mc;
        }

        return null;
    },

    /**
     * Returns an array of module controllers found specified on the element
     * @returns {Array}
     * @private
     */
    _createModuleControllers:function() {

        var result = [],
            config = this._element.getAttribute('data-module') || '',
            advanced = config.charAt(0) === '[';

        if (advanced) {

            var specs;

            // add multiple module controllers
            try {
                specs = JSON.parse(config);
            }
            catch(e) {
                // failed parsing spec
                throw new Error('Node: "data-module" attribute containing a malformed JSON string.');
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

                result.push(
                    new ModuleController(spec.path,this._element,{
                        'conditions':spec.conditions,
                        'options':spec.options
                    })
                );

            }


        }
        else if (config.length) {

            // add default module controller
            result.push(
                new ModuleController(config,this._element,{
                    'conditions':this._element.getAttribute('data-conditions'),
                    'options':this._element.getAttribute('data-options')
                })
            );

        }

        return result;

    }

};