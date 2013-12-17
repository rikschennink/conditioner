define(function(){

    return function(id,Parent,Child) {

        Child._Super = id;

        // set reference to super class
        Child._Parent = Parent;

        // copy prototype
        Child.prototype = Object.create(Parent.prototype);

        // return the constructor
        return Child;

    }

});