define(['conditioner/extendClass','../mock/bar'],function(extendClass,_super){


    console.log('Module: BAZ');


    var exports = extendClass(
        '../spec/mock/bar',
        _super,
        function(element,options) {
            this._element = element;
            this._options = options;
        }
    );

    exports.options = {
        'baz':'1'
    };

    exports.protoype = {};

    return exports;

});