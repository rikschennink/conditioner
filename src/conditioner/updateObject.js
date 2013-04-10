
/**
 * Creates a new object based on original object properties updated with the additions
 * @method updateObject
 * @param {object} original - The original object
 * @param {object} additions - The properties to override
 * @return {object} The result of the update
 */
var updateObject = function(original,additions) {

    var p,result = {};

    for(p in original) {
        if (!original.hasOwnProperty(p)) {continue;}
        result[p] = typeof original[p] == 'object' ? updateObject(original[p],additions[p]) : original[p];
    }

    for(p in additions) {
        if (!additions.hasOwnProperty(p)) {continue;}
        result[p] = typeof additions[p] == 'object' ? updateObject(original[p],additions[p]) : additions[p];
    }

    return result;

};
