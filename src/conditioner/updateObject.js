var updateObject = (function(){

    /**
     * Merges custom options passed for behavior with original behavior options
     * @method merge
     * @param {object} original - The original options
     * @param {object} additions - The additional fields to add or override
     * @return {object} The result of the two merged objects
     */
    var merge = function(original,additions) {

        var p,result = {};

        for(p in original) {
            if (!original.hasOwnProperty(p)) {continue;}
            result[p] = typeof original[p] == 'object' ? merge(original[p],additions[p]) : original[p];
        }

        for(p in additions) {
            if (!additions.hasOwnProperty(p)) {continue;}
            result[p] = typeof additions[p] == 'object' ? merge(original[p],additions[p]) : additions[p];
        }

        return result;

    };

    return merge;

}());