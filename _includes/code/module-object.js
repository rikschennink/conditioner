define(function(){

    /**
     * Export an object literal
     */
    var exports = {

        /**
         * Default options object (optional)
         */
        options:{
            'foo':'bar'
        },

        /**
         * Called by Conditioner to load the module
         * @param {Node} element
         * @param {Object} options
         * @returns {Object}
         */
        load:function(element,options) {
            // setup
        },

        /**
         * Called by Conditioner to unload the module
         */
        unload:function() {
            // restore
        }
    };

    return exports;
});