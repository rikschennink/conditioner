define(['conditioner/extendClass','../mock/bar'],function(_extend,_super){

    console.log('Module: BAZ');

    var exports = function Baz(element,options) {
        this._element = element;
        this._options = options;
    };

    _extend(exports,_super);

    exports.options = {
        'baz':1
    };

    exports.protoype = {};

    return exports;

});