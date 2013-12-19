define(['conditioner/extendClass','../mock/foo'],function(extendClass,_super){


    console.log('Module: BAR');


    var exports = extendClass(
        _super,
        function(element,options) {
            this._element = element;
            this._options = options;
        }
    );

    exports.options = {
        'bar':'1'
    };

    exports.protoype = {};



    return exports;

});