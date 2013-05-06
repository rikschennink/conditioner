
/**
 * Tests if an active network connection is available and monitors this connection
 * @module tests/connection
 */
define(function(){

    'use strict';

    return {

        setup:function(change) {
            navigator.connection.addEventListener('change',change,false);
        },

        support:function() {
            return 'connection' in navigator;
        },

        assert:function(expected) {
            return expected === 'any' && navigator.onLine;
        }
    };

});
