
/**
 * Tests if a media query is matched or not and listens to changes
 * @module tests/media
 */
define(['conditioner'],function(conditioner){

    'use strict';

    return {
        arrange:function() {

            this.remember('support','matchMedia' in window);

            this.act();
        },
        assert:function(expected) {

            var support = this.remember('support');
            if (!support) {
                return false;
            }

            // test if supported
            if (expected === 'supported') {
                return support;
            }

            // setup mql
            var mql = this.remember(expected);
            if (!mql) {
                var self = this;
                mql = window.matchMedia(expected);
                mql.addListener(function(){
                    self.act();
                });
                this.remember(expected,mql);
            }

            // if no media query list to remember, apparently not supported
            if (typeof mql === 'undefined') {
                return false;
            }

            // test media query
            return mql.matches;
        }
    };

});
