define(function(){

    var exports = function Mem(element,options) {

        this._element = element;
        this._options = options;

        this._el = document.createElement('div');
        this._el.textContent = 'el';
        this._element.appendChild(this._el);

    };

    exports.options = {
        'mem':'test'
    };

    exports.prototype = {

        unload:function() {

            this._el.parentNode.removeChild(this._el);
            this._el = null;

            this._element = null;
            this._options = null;

        }

    };

    return exports;

});