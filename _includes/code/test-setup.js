define(function() {

    return {

        /**
         * optional method for when you need to test if
         * the features used in the test are supported
         * by the users browser
         * @return {Boolean}
         */
        support:function() {

        },

        /**
         * use this method to setup your test, bind event listeners, etc.
         * use measure as the handler on your event listeners
         * @param {Function} measure
         */
        setup:function(measure) {

        },

        /**
         * optional method for when you need to do measurements before
         * the internal 'onchange' method is called.
         * @returns {Boolean}
         */
        measure:function() {

        },

        /**
         * test if the expected value matches the current value
         * @param {String} expected
         * @param {Element} element
         * @return {Boolean}
         */
        assert:function(expected,element) {

        }
    };

});
