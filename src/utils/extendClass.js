define(function(){

    return function(Parent,Child) {

        // set reference to super class
        Child.__parent = Parent;

        // copy prototype
        Child.prototype = Object.create(Parent.prototype);

        // return the constructor
        return Child;

    }

});