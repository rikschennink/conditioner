define(function(){


    console.log('Module: FOO');


    var exports = function(element,options) {
        this._element = element;
        this._options = options;
    };

    exports.options = {
        'foo':'1'
    };

    exports.protoype = {};

    return exports;

});