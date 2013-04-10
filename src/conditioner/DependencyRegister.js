
/**
 * @class DependencyRegister
 */
var DependencyRegister = {

    _dependencies:{},

    /**
     * Register a dependency
     * @method register
     * @param {string} id - identifier (interface) of Class
     * @param {string} path - path to module
     * @param {object} options - options to pass to instance
     */
    registerDependency:function(id,path,options) {

        // setup mapping
        var map = {};
        map[id] = path;

        // setup options
        var config = {};
        config[path] = options;

        // update requirejs config
        requirejs.config({
            map:{
                '*':map
            },
            config:config
        });

        // set dependencies
        this._dependencies[id] = {
            'options':options || {},
            'dependencies':null,
            'klass':null
        };

    },

    /**
     * Get a registered dependency
     * @method getSpecification
     * @param {string} id - identifier (interface) of Class
     * @return {object} - class specification object
     */
    getSpecification:function(id) {

        // if no id supplied throw error
        if (!id) {
            throw new Error('DependencyManager.getSpecification(id): "id" is a required parameter.');
        }

        return this._dependencies[id];
    }

};
