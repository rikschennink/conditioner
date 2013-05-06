
/**
 * Tests if a media query is matched or not and listens to changes
 * @module tests/media
 */
define(function(){

    'use strict';

    return {

        support:function() {
            return 'matchMedia' in window;
        },

        arrange:function(expected) {

            // if not supported don't try to setup
            if (!this.supported()) {return;}

            // setup mql
            var self = this;
            this._mql = window.matchMedia(expected);
            this._mql.addListener(function(){
                self.act();
            });

        },

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
