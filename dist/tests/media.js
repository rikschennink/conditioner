
/**
 * Tests if a media query is matched or not and listens to changes
 * @module tests/media
 */
define(function(){

    'use strict';

    return {

        /**
         * Does this browser support matchMedia
         * @returns {Boolean}
         */
        support:function() {
            return 'matchMedia' in window;
        },

        /**
         * Custom arrange method to setup matchMedia listener for each test instance
         * @param {String} expected
         */
        arrange:function(expected) {

            // if testing for support
            if (expected === 'supported') {
                return;
            }

            // if is media query
            var self = this;
            this._mql = window.matchMedia(expected);
            this._mql.addListener(function(){
                self.onchange();
            });

        },

        /**
         * Tests if the assert succeeds
         * @param expected
         * @returns {Boolean}
         */
        assert:function(expected) {

            // no support
            if (!this.supported()) {
                return false;
            }

            // test if supported
            if (expected === 'supported') {
                return this.supported();
            }

            // test media query
            return this._mql.matches;
        }

    };

});
