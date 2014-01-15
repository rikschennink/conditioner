define(function(){

    /**
     * JavaScript Inheritance
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_Revisited
     */
    return function() {

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

        // require actual super module (should already have loaded before calling extend) and copy prototype to child
        Child.prototype = Object.create(Child.__super.prototype);

        // return the Child Class
        return Child;

    };

});