
// has fixed path "mock/foo"

define(['../../lib/utils/extendClassOptions','mock/modules/foo'],function(_extend,_super){

    var exports = _extend('mock/modules/foo',function Bar(element,options){

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