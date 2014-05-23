define(function(){

    'use strict';

    // StarGazers Class
    var exports = function(element,options) {

        // set element and options reference
        this._element = element;
        this._options = options;

        // backup content
        this._inner = this._element.innerHTML;

        // load stargazer
        this._load();
    };

    // default options
    exports.options = {
        'user':'mdo',
        'repo':'github-buttons',
        'width':80,
        'height':20,
        'count':true,
        'type':'watch'
    };

    exports.prototype = {

        // load component
        _load:function() {
            this._element.innerHTML = '<iframe src="http://ghbtns.com/github-btn.html?user=' + this._options.user + '&repo=' + this._options.repo + '&type=' + this._options.type + '&count=' + this._options.count + '"' +
                'allowtransparency="true" ' +
                'frameborder="0" ' +
                'scrolling="0" ' +
                'width="' + this._options.width + '" ' +
                'height="' + this._options.height + '"></iframe>';
        },

        // unload stargazers
        unload:function() {

            this._element.innerHTML = this._inner;
        }
    };

    return exports;
});