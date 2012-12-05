
/**
 * BehaviourLoader
 *
 * @class BehaviourLoader
 */
Namespace.register('bc.core').BehaviourLoader = (function() {

    "use strict";

    // global BehaviourLoader cache object
    var _cache = {};

    /**
     * Constructs BehaviourLoader objects.
     *
     * @class BehaviourConditions
     * @constructor
     * @param {Object} element DOM Element
     */
    var BehaviourLoader = function(element) {

        // set element reference
        this._element = element;

        // check if conditions specified
        this._conditions = bc.core.BehaviourConditions.fromElement(this._element);
        if (!this._conditions) {
            this._loadBehaviour();
        }
        else {

            // listen to condition changes
            bc.helper.Observer.subscribe(this._conditions,'change',this._onConditionsChange.bind(this));

            // if conditions are met, load my behaviour
            if (this._conditions.areSuitable()) {
                this._loadBehaviour();
            }
        }

    };


    // prototype shortcut
    var p = BehaviourLoader.prototype;


    /**
     * Called when the conditions change.
     *
     * @method _onConditionsChange
     * @class BehaviourLoader
     */
    p._onConditionsChange = function() {

        var suitable = this._conditions.areSuitable();

        if (this._behaviour && !suitable) {
            this.unloadBehaviour();
        }

        if (!this._behaviour && suitable) {
            this._loadBehaviour();
        }
    };

    /**
     * Load the behaviour set in the data-behaviour attribute
     *
     * @class BehaviourLoader
     * @method _loadBehaviour
     */
    p._loadBehaviour = function() {

        var classPath = this._element.getAttribute('data-behaviour');

        this._behaviourConstructor = this._getBehaviourConstructorByClassPath(classPath);

        if (!this._behaviourConstructor) {
            this._getBehaviourFileByClassPath(classPath);
        }
        else {
            this._initBehaviour();
        }
    };


    /**
     * Initialize the behaviour
     *
     * @class BehaviourLoader
     * @method _initBehaviour
     */
    p._initBehaviour = function() {

        this._behaviour = new this._behaviourConstructor(this._element);

    };

    /**
     * Public method for unload the behaviour
     *
     * @class BehaviourLoader
     * @method unloadBehaviour
     */
    p.unloadBehaviour = function() {

        if (!this._behaviour) {
            return false;
        }

        this._behaviour._unload();
        this._behaviour = null;

        return true;
    };

    /**
     * Try to get Behaviour by classPath.
     *
     * @class BehaviourLoader
     * @method _getBehaviourConstructorByClassPath
     * @param {String} classPath The classPath to the Behaviour
     * @return {Object} The Behaviour
     */
    p._getBehaviourConstructorByClassPath = function(classPath) {

        if (!classPath) {return null;}

        // define vars and check reference to this behaviour has been cached
        var levels,behaviour,depth,i,cachedReference = _cache[classPath];
        if (cachedReference) {
            return cachedReference;
        }

        levels = classPath.split('.');
        depth = levels.length;
        behaviour = window;

        for (i=0;i<depth; i++)
        {
            if (behaviour[levels[i]] === undefined) {
                return null;
            }
            behaviour = behaviour[levels[i]];
        }

        // cache result
        _cache[classPath] = behaviour;

        return behaviour;
    };


    /**
     * Try to load Behaviour by class path.
     *
     * @class BehaviourLoader
     * @method _getBehaviourFileByClassPath
     * @param {String} classPath The class path to the Behaviour
     */
    p._getBehaviourFileByClassPath = function(classPath) {

        // set scripts list
        if (!this._scripts) {
            this._scripts = [];
        }

        // build url
        var options,url,i,script;
        options = bc.core.OptionsController.getInstance().getOptionsForClassPath('bc.core.BehaviourLoader');
        url = options.url.js + classPath.replace(/\./g,'/') + '.js';

        // check if already loading this script
        for (i=this._scripts.length-1;i>=0;i--) {
            if (this._scripts[i].url === url) {
                console.warn('BehaviourLoader: Already loading or could not find behaviour: "' + classPath + '"');
                return false;
            }
        }

        // request resource
        script = bc.helper.ScriptLoader.load(url,this._loadBehaviour.bind(this));
        this._scripts.push(script);
    };

    // Register class
    return BehaviourLoader;

}());