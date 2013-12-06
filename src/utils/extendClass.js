define(['conditioner/mergeObjects'],function(mergeObjects){

    return function(parent,child,childOptions) {

        // set child options to empty object if not defined
        childOptions = childOptions || {};

        // copy options
        child.options = parent.options ? mergeObjects(parent.options,childOptions) : childOptions;

        // copy prototype
        child.prototype = Object.create(parent.prototype);

        // return the constructor
        return child;

    }

});