
// has relative path "../mock/bar"

define(['require','utils/extendClass','./bar'],function(require,_extend,_super){

    //console.log('Module: BAZ');

    var exports = _extend(require,'./bar',function Baz(element,options){

        // baz

        _super.call(this,element,options);

        this._element.setAttribute('data-baz',options.baz);

    });

    exports.options = {
        'baz':1
    };

    exports.prototype.baz = function() {
        console.log('baz function');
    };

    return exports;

});