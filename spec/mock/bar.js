define(['conditioner/extendClass','../mock/foo'],function(_extend,_super){

    console.log('Module: BAR');

    var exports = function Bar(element,options) {
        this._element = element;
        this._options = options;
    };

    _extend(exports,'../mock/foo');

    exports.options = {
        'bar':1
    };

    exports.protoype = {};

    return exports;

});