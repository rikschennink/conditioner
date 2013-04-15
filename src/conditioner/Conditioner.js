
/**
 * @class Conditioner
 */
var Conditioner = (function(ModuleRegister,ModuleController,mergeObjects,Test,Module,Observer){


    /**
     * @constructor
     */
    var Conditioner = function() {

        // options for conditioner
        this._options = {
            'attribute':{
                'module':'data-module',
                'alternative':'data-module-alt',
                'conditions':'data-conditions',
                'options':'data-options',
                'options-alt':'data-options-alt',
                'priority':'data-priority'
            },
            'modules':{}
        };

        // array of all active controllers
        this._controllers = [];

    };

    // prototype shortcut
    var p = Conditioner.prototype;


    /**
     * @method setOptions, set custom options
     * @param {object} options - options to override
     */
    p.setOptions = function(options) {

        // update options
        this._options = mergeObjects(this._options,options);

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


    };


    /**
     * Applies behavior on object within given context.
     *
     * @method applyBehavior
     * @param {Element} context - Context to apply behavior to
     * @return {Array} - Array of initialized ModuleControllers
     */
    p.applyBehavior = function(context) {

        // if no context supplied throw error
        if (!context) {
            throw new Error('Conditioner.applyBehavior(context,options): "context" is a required parameter.');
        }

        // register vars and get elements
        var elements = context.querySelectorAll('[' + this._options.attribute.module + ']'),
            i = 0,
            l = elements.length,
            controllers = [],
            priorityList = [],
            controller,
            element,
            specs,
            spec;

        // if no elements do nothing
        if (!elements) {
            return [];
        }

        // process elements
        for (; i<l; i++) {

            // set element reference
            element = elements[i];

            // skip element if already processed
            if (element.getAttribute('data-processed') == 'true') {
                continue;
            }

            // has been processed
            element.setAttribute('data-processed','true');

            // get specs
            specs = this._getModuleSpecificationsByElement(element);

            // apply specs
            while (spec = specs.shift()) {

                // create controller instance
                controller = new ModuleController(
                    spec.path,
                    {
                        'target':element,
                        'conditions':spec.conditions,
                        'options':spec.options,
                        'suitable':spec.suitable
                    }
                );

                // add to priority list
                priorityList.push({
                    'controller':controller,
                    'priority':spec.priority
                });

                // add to controllers
                controllers.push(controller);
            }
        }

        // sort controllers by priority:
        // higher numbers go first,
        // then 0 (or no priority assigned),
        // then negative numbers
        priorityList.sort(function(a,b){
            return b.priority - a.priority;
        });

        // initialize modules depending on assigned priority
        l = controllers.length;
        for (i=0; i<l; i++) {
            priorityList[i].controller.init();
        }

        // merge new controllers with current controllers
        this._controllers = this._controllers.concat(controllers);

        // returns copy of controllers so it is possible to later unload modules manually if necessary
        return controllers;
    };


    /**
     * Reads specifications for module from the element attributes
     *
     * @method _getBehaviorSpecificationsByElement
     * @param {Element} element - Element to parse
     * @return {Array} behavior specifications
     */
    p._getModuleSpecificationsByElement = function(element) {

        var path = element.getAttribute(this._options.attribute.module),
            multiple = path.charAt(0) === '[',
            result = [],
            conditions,
            alternate;

        // get multiple specs
        if (multiple) {

            // get conditions
            conditions = this._getElementAttributeAsObject(element,this._options.attribute.conditions);

            // specific vars for multiple elements
            var paths = this._getElementAttributeAsObject(element,this._options.attribute.module),
                options = this._getElementAttributeAsObject(element,this._options.attribute.options),
                priorities = this._getElementAttributeAsObject(element,this._options.attribute.priority),
                l=paths.length,
                i=0;

            for (;i<l;i++) {

                result.push({
                    'path':paths[i],
                    'conditions':conditions.length ? conditions[i] : conditions,
                    'options':options.length ? options[i] : options,
                    'priority':priorities.length ? priorities[i] : priorities,
                    'suitable':true
                });

            }

        }
        else {

            // get conditions, these are shared among default and alternate module
            conditions = element.getAttribute(this._options.attribute.conditions);

            // add default module
            result.push({
                'path':path,
                'conditions':conditions,
                'options':element.getAttribute(this._options.attribute.options),
                'priority':element.getAttribute(this._options.attribute.priority),
                'suitable':true
            });

            // test if alternate module specified
            alternate = element.getAttribute(this._options.attribute.alternative);

        }

        // if alternate specified
        if (alternate) {

            // todo: alternate currently gets same options as default module, related to https://github.com/rikschennink/conditioner/issues/8

            result.push({
                'path':alternate,
                'conditions':conditions,
                'options':element.getAttribute(this._options.attribute.options),
                'priority':element.getAttribute(this._options.attribute.priority),
                'suitable':false
            });

        }

        return result;

    };


    /**
     * Tries to convert element attribute value to an object
     *
     * @method _getElementAttributeAsObject
     * @param {Element} element - Element to find attribute on
     * @param {string} attribute - Attribute value to convert
     * @return {object} array or object
     */
    p._getElementAttributeAsObject = function(element,attribute) {

        var value = element.getAttribute(attribute);
        if (value) {
            try {
                return JSON.parse(value);
            }
            catch(e) {}
        }
        return [value];

    };


    /**
     * Returns ModuleControllers matching the selector
     *
     * @method getModule
     * @param {object} query - Query to match the ModuleController to, could be ClassPath, Element or CSS Selector
     * @return {object} controller - First matched ModuleController
     */
    p.getModule = function(query) {
        var controller,i=0,l = this._controllers.length;
        for (;i<l;i++) {
            controller = this._controllers[i];
            if (controller.matchesQuery(query)) {
                return controller;
            }
        }
        return null;
    };


    /**
     * Returns all ModuleControllers matching the selector
     *
     * @method getModuleAll
     * @param {object} query - Query to match the controller to, could be ClassPath, Element or CSS Selector
     * @return {Array} results - Array containing matched behavior controllers
     */
    p.getModuleAll = function(query) {
        if (typeof query == 'undefined') {
            return this._controllers.concat();
        }
        var controller,i=0,l = this._controllers.length,results=[];
        for (;i<l;i++) {
            controller = this._controllers[i];
            if (controller.matchesQuery(query)) {
                results.push(controller);
            }
        }
        return results;
    };


    // Singleton structure
    var _instance;

    return {

        /**
         * Returns an instance of the Conditioner
         * @method getInstance
         * @return instance of Conditioner
         */
        getInstance:function() {
            if (!_instance) {_instance = new Conditioner();}
            return _instance;
        },

        /**
         * Reference to Test base class
         */
        Test:Test,

        /**
         * Reference to Module base class
         */
        Module:Module,

        /**
         * Reference to Observer class
         */
        Observer:Observer,

        /**
         * Reference to updateObject method
         */
        mergeObjects:mergeObjects

    };

}(ModuleRegister,ModuleController,mergeObjects,Test,Module,Observer));
