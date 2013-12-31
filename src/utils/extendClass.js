define(function(){

    return function() {

        var req = typeof arguments[0] === 'string' ? requirejs : arguments[0];

        // get child
        var Child = arguments[arguments.length-1];

        var path = typeof arguments[0] === 'string' ? arguments[0] : arguments[1];

        //console.log('PATH:',req.toUrl(path));

        // set reference to super class path
        // if index 0 is of type string this is a path, if not it is a require reference and path is (should be) located at index 1
        //Child.__super = typeof arguments[0] === 'string' ? arguments[0] : arguments[0].toUrl(arguments[1]);
        Child.__superUrl = typeof arguments[0] === 'string' ? arguments[0] : req.toUrl(path);

        // set super object reference
        Child.__super = req(path);

        // require actual super module (should already have loaded before calling extend) and copy prototype to child
        Child.prototype = Object.create(Child.__super.prototype);

        // return the Child Class
        return Child;

        /*
        // get child
        var Child = arguments[arguments.length-1];

        // set reference to super class path
        // if index 0 is of type string this is a path, if not it is a require reference and path is (should be) located at index 1
        Child.__super = typeof arguments[0] === 'string' ? arguments[0] : arguments[0].toUrl(arguments[1]);

        // require actual super module (should already have loaded before calling extend) and copy prototype to child
        Child.prototype = Object.create(requirejs(Child.__super).prototype);

        // return the Child Class
        return Child;
        */

    };

});