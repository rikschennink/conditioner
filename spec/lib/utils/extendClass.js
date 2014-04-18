(function(win,undefined){

    'use strict';

    /**
     * JavaScript Inheritance
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_Revisited
     */
    var util = function() {

        // get child constructor
        var Child = arguments[arguments.length-1],
            first = arguments[0],req,path;

        if (typeof first === 'string') {
            req = requirejs;
            path = first;
            Child.__superUrl = first;
        }
        else {
            req = first;
            path = arguments[1];
            Child.__superUrl = req.toUrl(path);
        }

        // set super object reference
        Child.__super = req(path);

        // copy prototype to child
        Child.prototype = Object.create(Child.__super.prototype);

        // return the Child Class
        return Child;

    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = util;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function(){return util;});
    }
    // Browser globals
    else {
        win.extendClassWithOptions = util;
    }

}(window));