
// no dependencies

define(['module'],function(module){

    //console.log('Module: FOO');

    //console.log(module.config().foo);

    var exports = function Foo(element,options) {

        // foo

        this._element = element;
        this._options = options;

        this._element.setAttribute('data-foo',options.foo);

    };

    exports.options = {
        'foo':1
    };

    exports.prototype = {
        foo:function() {
            console.log('foo function');
        }
    };

    return exports;

});