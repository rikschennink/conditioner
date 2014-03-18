/**
 * Static Module Agent, will always load the module
 * @type {Object}
 */
var StaticModuleAgent = {

    /**
     * Is activation currently allowed, will always return true for static module agent
     * @returns {boolean}
     */
    allowsActivation:function() {
        return true;
    },

    /**
     * Clean up
     * As we have not attached any event listeners there's nothing to clean
     */
    destroy:function() {
        // nothing to clean up
    }
};