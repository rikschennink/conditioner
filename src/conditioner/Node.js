
/**
 * @class Node
 */
var Node = (function(Observer){


    /**
     * @constructor
     * @param {Element} element
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

    var p = Node.prototype;


    /**
     * Static method testing if the current element has been processed already
     * @method getPriority
     */
    Node.hasProcessed = function(element) {
        return element.getAttribute('data-processed') === 'true';
    };


    /**
     * Returns the set priority for this node
     * @method getPriority
     */
    p.getPriority = function() {
        return this._priority;
    };


    /**
     * Initializes the node
     * @method init
     */
    p.init = function() {

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

    p._onModuleReady = function() {

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

    p._onModulesReady = function() {

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
     * @method _onModuleReady
     */
    p._onModuleAvailable = function(moduleController) {

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

    p._setActiveModuleController = function(moduleController) {

        // clean up active module controller reference
        this._cleanActiveModuleController();

        // set new active module controller
        this._activeModuleController = moduleController;
        Observer.subscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);
        this._activeModuleController.load();

    };

    p._cleanActiveModuleController = function() {

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

    p._onActiveModuleUnload = function() {

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

    p._getSuitableActiveModuleController = function() {

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
     * @method _getModuleControllers
     */
    p._getModuleControllers = function() {

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
     * @method matchesQuery
     * @param {object || string} query - string query to match or object to match
     * @return {boolean} if matched
     */
    p.matchesQuery = function(query) {

        return null; // todo: link to controller

    };


    /**
     * Public method for safely executing methods on the loaded module
     * @method execute
     * @param {string} method - method key
     * @param {Array} [params] - array containing the method parameters
     * @return
     */
    p.execute = function(method,params) {

        return null; // todo: link to controller

    };

    return Node;
    
}(Observer));
