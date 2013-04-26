
/**
 * @exports ModuleController
 * @class
 * @constructor
 * @param {string} path - reference to module
 * @param {object} options - options for this behavior controller
 */
var ModuleController = function(path,options) {

    // if no element, throw error
    if (!path) {
        throw new Error('ModuleController(path,options): "path" is a required parameter.');
    }

    // options for class behavior controller should load
    this._path = path;

    // options for behavior controller
    this._options = options || {};

    // module reference
    this._Module = null;

    // module instance reference
    this._moduleInstance = null;

    // check if conditions specified
    this._conditionManager = new ConditionsManager(
        this._options.conditions,
        this._options.target
    );

    // listen to ready event on condition manager
    Observer.subscribe(this._conditionManager,'ready',this._onReady.bind(this));

    // by default module is not ready and not available unless it's not conditioned or conditions are already suitable
    this._ready = !this.isConditioned() || this._conditionManager.getSuitability();
    this._available = false;


};


/**
 * Returns true if the module is ready to be initialized
 * @return {boolean}
 * @public
 */
ModuleController.prototype.isAvailable = function() {
    this._available = this._conditionManager.getSuitability();
    return this._available;
};


/**
 * Returns true if the module has no conditions defined
 * @return {boolean}
 * @public
 */
ModuleController.prototype.isConditioned = function() {
    return typeof this._options.conditions !== 'undefined';
};


/**
 * Returns true if the module is ready
 * @return {boolean}
 * @public
 */
ModuleController.prototype.isReady = function() {
    return this._ready;
};

/**
 * @private
 * @fires ready
 */
ModuleController.prototype._onReady = function(suitable) {

    // module is now ready (this does not mean it's available)
    this._ready = true;

    // listen to changes in conditions
    Observer.subscribe(this._conditionManager,'change',this._onConditionsChange.bind(this));

    // let others know we are ready
    Observer.publish(this,'ready');

    // are we available
    if (suitable) {
        this._onAvailable();
    }

};

/**
 * @private
 * @fires available
 */
ModuleController.prototype._onAvailable = function() {

    // module is now available
    this._available = true;

    // let other know we are available
    Observer.publish(this,'available',this);

};


/**
 * Called when the conditions change
 * @private
 */
ModuleController.prototype._onConditionsChange = function() {

    var suitable = this._conditionManager.getSuitability();

    if (this._moduleInstance && !suitable) {
        this.unload();
    }

    if (!this._moduleInstance && suitable) {
        this._onAvailable();
    }

};




/**
 * Load the module set in the referenced in the path property
 * @public
 */
ModuleController.prototype.load = function() {

    // if module available no need to require it
    if (this._Module) {
        this._onLoad();
        return;
    }

    // load module, and remember reference
    var self = this;
    require([this._path],function(Module){

        // set reference to Module
        self._Module = Module;

        // module is now ready to be loaded
        self._onLoad();

    });

};

/**
 * Method called when module loaded
 * @fires load
 * @private
 */
ModuleController.prototype._onLoad = function() {

    // if no longer available
    if (!this.isAvailable()) {
        return;
    }

    // get module specification
    var specification = ModuleRegister.getModuleByPath(this._path),
        moduleOptions = specification ? specification.config : {},
        elementOptions = {},
        options;

    // parse element options
    if (typeof this._options.options == 'string') {
        try {
            elementOptions = JSON.parse(this._options.options);
        }
        catch(e) {
            throw new Error('ModuleController.loadModule(): "options" is not a valid JSON string.');
        }
    }
    else {
        elementOptions = this._options.options;
    }

    // merge module default options with element options if found
    options = moduleOptions ? Utils.mergeObjects(moduleOptions,elementOptions) : elementOptions;

    // create instance
    this._moduleInstance = new this._Module(this._options.target,options);

    // propagate events from actual module to module controller
    // this way it is possible to listen to events on the controller which is always there
    Observer.setupPropagationTarget(this._moduleInstance,this);

    // publish load event
    Observer.publish(this,'load',this);

};


/**
 * Unloads the module
 * @fires unload
 * @return {boolean}
 * @public
 */
ModuleController.prototype.unload = function() {

    // module is now no longer ready to be loaded
    this._available = false;

    // if no module, module has already been unloaded or was never loaded
    if (!this._moduleInstance) {
        return false;
    }

    // clean propagation target
    Observer.removePropagationTarget(this._moduleInstance,this);

    // unload behavior if possible
    if (this._moduleInstance._unload) {
        this._moduleInstance._unload();
    }

    // reset property
    this._moduleInstance = null;

    // publish unload event
    Observer.publish(this,'unload',this);

    return true;
};


/**
 * Checks if the module matches the given query
 * @param {object|string} query - string query to match or object to match
 * @return {boolean} if matched
 * @public
 */
ModuleController.prototype.matchesQuery = function(query) {

    if (typeof query == 'string') {

        // check if matches query
        if (Utils.matchesSelector(this._options.target,query)) {
            return true;
        }

    }

    return (query == this._options.target);
};



/**
 * Executes a methods on the loaded module
 * @param {string} method - method key
 * @param {Array} params - optional array containing the method parameters
 * @return {null|object} return value of executed method or null if no module set
 * @public
 */
ModuleController.prototype.execute = function(method,params) {

    // if behavior not loaded
    if (!this._moduleInstance) {
        return null;
    }

    // get function reference
    var F = this._moduleInstance[method];
    if (!F) {
        throw new Error('ModuleController.execute(method,params): function specified in "method" not found on module.');
    }

    // once loaded call method and pass parameters
    return F.apply(this._moduleInstance,params);

};
