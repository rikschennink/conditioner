define(function(){

    'use strict';

    var exports = function(element,options) {

        this._element = element;
        this._options = options;

        this._btn = document.createElement('button');
        this._btn.textContent = 'zoom in';
        this._btn.addEventListener('click',this,false);
        this._element.appendChild(this._btn);

    };

    exports.options = {
        fontSize:'2em'
    };

    exports.prototype = {

        handleEvent:function(e) {
            if (e.type === 'click'){
                if (!this._element.style.fontSize) {
                    this._zoomIn();
                }
                else {
                    this._zoomOut();
                }
            }
        },

        _zoomIn:function() {
            this._btn.textContent = 'zoom out';
            this._element.style.fontSize = this._options.fontSize;
        },

        _zoomOut:function() {
            this._btn.textContent = 'zoom in';
            this._element.style.fontSize = null;
        },

        unload:function() {

            // restore scale
            this._zoomOut();

            // remove button
            this._btn.removeEventListener('click',this,false);
            this._btn.parentNode.removeChild(this._btn);

        }

    };

    return exports;
});