define(function(){

    /**
     * Export an object literal
     */
    var exports = {

        /**
         * Optional, default options object
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

            // conditioner requires a returned object reference
            return this;
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