define(['conditioner'],function(conditioner){

    'use strict';

    // reference to parent class
    var _parent = conditioner.ModuleBase;

    // Map Class
    var exports = function(element) {

        // Call ModuleBase constructor
        _parent.call(this,element);

        // event binds
        this._onSuccessBind = this._onSuccess.bind(this);
        this._onErrorBind = this._onError.bind(this);

        // backup content
        this._inner = this._element.innerHTML;

        // test if geolocation support, otherwise map won't function
        var support = 'geolocation' in navigator;
        if (!support) {
            this._element.innerHTML = 'Your browser does not support the Geolocation API';
            return;
        }

        // loading map
        this._loading = true;
        this._element.innerHTML = 'Loading map...';

        // get position (wait max 5 seconds for it)
        navigator.geolocation.getCurrentPosition(this._onSuccessBind,this._onErrorBind,{timeout:10000});
    };

    // Extend from ModuleBase
    var p = exports.prototype = Object.create(_parent.prototype);

    // get position success
    p._onSuccess = function(position) {

        // if no longer loading, stop here
        if (!this._loading) {
            return;
        }

        // clear
        this._loading = false;
        this._element.innerHTML = '';

        // append map
        var image = document.createElement('img');
        image.src = 'http://maps.googleapis.com/maps/api/staticmap?center=' + position.coords.latitude + ',' + position.coords.longitude + '&zoom=14&size=' + 500 + 'x' + 300 + '&maptype=roadmap&sensor=false';
        image.alt = '';
        image.className = 'map';
        this._element.appendChild(image);

    };

    // get position fail
    p._onError = function(error) {

        // if no longer loading, stop here
        if (!this._loading) {
            return;
        }

        this._loading = false;
        this._element.innerHTML = error.message;
    };

    // Unload Map behaviour
    p.unload = function() {

        // call ModuleBase unload method
        _parent.prototype.unload.call(this);

        // no longer loading
        this._loading = false;

        // restore content
        this._element.innerHTML = this._inner;

    };

    return exports;

});