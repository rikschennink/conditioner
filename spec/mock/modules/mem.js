define(function(){

    var exports = function Mem(element,options) {

        this._element = element;
        this._options = options;

        this._el = document.createElement('div');
        this._el.textContent = Array(this._options.frame).join('.')
        this._element.appendChild(this._el);

    };

    exports.options = {
        'frame':0
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