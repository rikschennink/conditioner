
/**
 * Tests if an active network connection is available and monitors this connection
 * @module tests/connection
 */
define(['conditioner'],function(conditioner){

    'use strict';

    return {
        arrange:function(){

            if (!('connection' in navigator)) {return;}

            navigator.connection.addEventListener('change',this,false);

        },
        assert:function(expected) {
            return expected === 'any' && navigator.onLine;
        }
    };

});
