

/**
 * @exports Node
 * @class
 * @constructor
 * @param {element} element
 */
var Node = function(element) {

    // set element reference
    this._element = element;

    // has been processed
    this._element.setAttribute('data-processed','true');

    // set priority
    this._priority = this._element.getAttribute('data-priority');

    // contains references to all module controllers
    this._moduleControllers = [];

    // contains reference to currently active module controller
    this._activeModuleController = null;

    // method to unbind
    this._activeModuleUnloadBind = this._onActiveModuleUnload.bind(this);

};


/**
 * Static method testing if the current element has been processed already
 * @static
 */
Node.hasProcessed = function(element) {
    return element.getAttribute('data-processed') === 'true';
};


/**
 * Returns the set priority for this node
 * @public
 */
Node.prototype.getPriority = function() {
    return this._priority;
};


/**
 * Initializes the node
 * @public
 */
Node.prototype.init = function() {

    // parse element module attributes
    this._moduleControllers = this._getModuleControllers();

    // listen to ready events on module controllers
    var l=this._moduleControllers.length,i,mc;

    // initialize modules
    for (i=0;i<l;i++) {

        mc = this._moduleControllers[i];

        // if module already ready, check if all modules loaded now
        if (mc.isReady()) {
            this._onModuleReady();
            continue;
        }

        // otherwise, listen to ready event
        Observer.subscribe(mc,'ready',this._onModuleReady.bind(this));

    }

};

/**
 * Called when a module has indicated it is ready
 * @private
 */
Node.prototype._onModuleReady = function() {

    // check if all modules ready, if so, call on modules ready
    var i=0,l=this._moduleControllers.length;

    for (;i<l;i++) {
        if (!this._moduleControllers[i].isReady()) {
            return;
        }
    }

    // all modules ready
    this._onModulesReady();

};

/**
 * Called when all modules are ready
 * @private
 */
Node.prototype._onModulesReady = function() {

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

};


/**
 * Called when a module controller has indicated it is ready to be loaded
 * @param moduleController
 * @private
 */
Node.prototype._onModuleAvailable = function(moduleController) {

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

};

/**
 * Sets the active module controller
 * @param moduleController
 * @private
 */
Node.prototype._setActiveModuleController = function(moduleController) {

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

};

/**
 * Removes the active module controller
 * @private
 */
Node.prototype._cleanActiveModuleController = function() {

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
};

/**
 * Called when active module unloaded
 * @private
 */
Node.prototype._onActiveModuleUnload = function() {

    // clean up active module controller reference
    this._cleanActiveModuleController();

    // active module was unloaded, find another active module
    var moduleController = this._getSuitableActiveModuleController();
    if(!moduleController) {
        return;
    }

    // set found module controller as new active module controller
    this._setActiveModuleController(moduleController);
};

/**
 * Returns a suitable module controller
 * @returns {null|ModuleController}
 * @private
 */
Node.prototype._getSuitableActiveModuleController = function() {

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
};


/**
 * Returns an array of module controllers found specified on the element
 * @returns {Array}
 * @private
 */
Node.prototype._getModuleControllers = function() {

    var result = [];
    var config = this._element.getAttribute('data-module');
    var advanced = config.charAt(0) == '[';

    if (advanced) {

        var specs;

        // add multiple module controllers
        try {
            specs = JSON.parse(config);
        }
        catch(e) {
            // failed parsing spec
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
                new ModuleController(spec.path,{
                    'conditions':spec.conditions,
                    'options':spec.options,
                    'target':this._element
                })
            );

        }


    }
    else {

        // add default module controller
        result.push(
            new ModuleController(config,{
                'conditions':this._element.getAttribute('data-conditions'),
                'options':this._element.getAttribute('data-options'),
                'target':this._element
            })
        );

    }

    return result;

};


/**
 * Public method to check if the module matches the given query
 * @param {object|string} query - string query to match or object to match
 * @return {boolean} if matched
 * @public
 */
Node.prototype.matchesQuery = function(query) {

    return null; // todo: link to controller

};

/**
 * Public method for safely executing methods on the loaded module
 * @param {string} method - method key
 * @param {Array} params - array containing the method parameters
 * @return {object} return value of executed method
 * @public
 */
Node.prototype.execute = function(method,params) {

    return null; // todo: link to controller

};
