define(function(){

    /**
     * Exports a constructor
     * @param {Node} element
     * @param {Object} options
     */
    var exports = function(element,options) {
        // setup
    };

    /**
     * Optional, default module options
     */
    exports.options = {
        'foo':'bar'
    };

    /**
     * Called by Conditioner to unload the module
     */
    exports.prototype.unload = function() {
        // restore
    };

    return exports;
});