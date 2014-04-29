/**
 * Tests if a media query is matched or not and listens to changes
 * @module monitors/media
 */
(function(win,undefined){

    'use strict';

    var exports = {
        unique:true,
        data:{
            mql:null
        },
        trigger:function(bubble,data){

            // if testing for support don't run setup
            if (data.expected === 'supported') {return;}

            // if is media query
            data.mql = win.matchMedia(data.expected);
            data.mql.addListener(function () {
                bubble();
            });

        },
        parse:function(expected){
            if (expected === 'supported') {
                return {
                    test:'supported',
                    value:true
                }
            }
            return {
                test:'*',
                value:expected
            }
        },
        test:{
            'supported':function(){
                return 'matchMedia' in win;
            },
            '*':function(data){
                return data.mql.matches;
            }
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function(){return exports;});
    }

}(window));