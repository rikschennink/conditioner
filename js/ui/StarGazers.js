define(['conditioner'],function(conditioner){

    'use strict';

    // reference to parent class
    var _parent = conditioner.ModuleBase;

    // Class
    var exports = function(element,options) {

        // set default options
        this._options = {
            'user':'mdo',
            'repo':'github-buttons',
            'width':80,
            'height':20,
            'count':true,
            'type':'watch'
        };

        // call ModuleBase constructor
        _parent.call(this,element,options);

        // backup content
        this._inner = this._element.innerHTML;

        // load iframe
        this._load();
    };

    // Extend from ModuleBase
    var p = exports.prototype = Object.create(_parent.prototype);

    // load component
    p._load = function() {
        this._element.innerHTML = '<iframe src="http://ghbtns.com/github-btn.html?user=' + this._options.user + '&repo=' + this._options.repo + '&type=' + this._options.type + '&count=' + this._options.count + '"' +
            'allowtransparency="true" ' +
            'frameborder="0" ' +
            'scrolling="0" ' +
            'width="' + this._options.width + '" ' +
            'height="' + this._options.height + '"></iframe>';
    };

    // Unload StarGazer
    p.unload = function() {

        // call ModuleBase unload method
        _parent.prototype.unload.call(this);

        // restore content
        this._element.innerHTML = this._inner;
    };

    return exports;

});