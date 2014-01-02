
// has fixed path "mock/foo"

define(['utils/extendClass','mock/foo'],function(_extend,_super){

    //console.log('Module: BAR');

    var exports = _extend('mock/foo',function Bar(element,options){

        // bar

        _super.call(this,element,options);

        this._element.setAttribute('data-bar',options.bar);
    });

    exports.options = {
        'bar':1
    };

    exports.prototype.bar = function() {
        console.log('bar function');
    };

    return exports;

});