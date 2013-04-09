define(function(){

    'use strict';

    /**
     * Merges custom options passed for behavior with original behavior options
     * @method merge
     * @param {Object} o - The original options
     * @param {Object} c - The changes to apply
     * @return {Object} The result of the two merged objects
     */
    var merge = function(o,c) {

        var p,r = {};

        for(p in o) {
            if (!o.hasOwnProperty(p)) {continue;}
            r[p] = typeof o[p] == 'object' ? merge(o[p],c[p]) : o[p];
        }

        for(p in c) {
            if (!c.hasOwnProperty(p)) {continue;}
            r[p] = typeof c[p] == 'object' ? merge(o[p],c[p]) : c[p];
        }

        return r;

    };

    return merge;

});