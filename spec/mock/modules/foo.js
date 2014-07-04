
define(function(){

    var exports = function Foo(element,options) {

        this._element = element;
        this._options = options;

        this._element.setAttribute('data-foo',options.foo);

    };

    exports.options = {
        'foo':1,
        'level':{
            'a':'default',
            'b':[0,1,2,3],
            'c':'base',
            'd':1.1
        }
    };

    exports.prototype = {

        foo:function() {
            console.log('foo function');
        },

        ping:function() {
            Observer.publish(this,'ping');
            return true;
        }

    };

    return exports;

});