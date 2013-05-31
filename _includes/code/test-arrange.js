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
         * optional method used instead of default 'setup + measure' combo
         * for when you need more customization
         * @param {String} expected
         * @param {Element} element
         */
        arrange:function(expected,element) {

            // manually call the 'onchange' method

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
