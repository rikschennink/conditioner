/**
 * Tests if the window dimensions match certain expectations
 * @module tests/window
 */
define(['conditioner'],function(conditioner){

    'use strict';

    return {
        arrange:function() {

            // arrange
            window.addEventListener('resize',this,false);

        },
        assert:function(expected) {

            // assert
            var innerWidth = window.innerWidth || document.documentElement.clientWidth,
                parts = expected.split(':'),
                key = parts[0],
                value = parseInt(parts[1],10);

            if (key === 'min-width') {
                return innerWidth >= value;
            }
            else if (key === 'max-width') {
                return innerWidth <= value;
            }

            return false;

        }
    };

    /*
    var Test = {

        handleEvent:function() {
            conditioner.Observer.publish(this,'change');
        },

        arrange:function() {
            window.addEventListener('resize',this,false);
        },

        assert:function(expected) {

            var innerWidth = window.innerWidth || document.documentElement.clientWidth,
                parts = expected.split(':'),
                key = parts[0],
                value = parseInt(parts[1],10);

            if (key === 'min-width') {
                return innerWidth >= value;
            }
            else if (key === 'max-width') {
                return innerWidth <= value;
            }

            return false;

        }

    };

    return {

        load:function() {
            return Test;
        },

        hash:function() {
            return 'window';
        }

    };



    /*

    var exports = conditioner.TestBase.inherit(),
        p = exports.prototype;

    p.handleEvent = function(e) {
        this.assert();
    };

    p.arrange = function() {
        window.addEventListener('resize',this,false);
    };

    p._onAssert = function(expected) {

        var innerWidth = window.innerWidth || document.documentElement.clientWidth,
            parts = expected.split(':'),
            key = parts[0],
            value = parseInt(parts[1],10);

        switch(key) {
            case 'min-width':{
                return innerWidth >= value;
            }
                break;
            case 'max-width':{
                return innerWidth <= value;
            }
        }

        return false;
    };

    return exports;

    */

});
