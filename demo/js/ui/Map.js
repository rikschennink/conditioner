define(['Conditioner'],function(Conditioner){

    "use strict";

    // reference to parent class
    var _parent = Conditioner.ModuleBase;

    // Map Class
    var Map = function(element) {

        // test if geolocation support, otherwise map won't function
        if (!navigator.geolocation) {
            return;
        }

        // Call BehaviourBase constructor
        _parent.call(this,element);

        // event binds
        this._onSuccessBind = this._onSuccess.bind(this);
        this._onErrorBind = this._onError.bind(this);

        // backup content
        this._inner = this._element.innerHTML;

        // loading map
        this._element.innerHTML = 'Loading map...';

        // get position (wait max 5 seconds for it)
        navigator.geolocation.getCurrentPosition(this._onSuccessBind,this._onErrorBind,{timeout:5000});
    };

    // Extend from BehaviourBase
    var p = Map.prototype = Object.create(_parent.prototype);

    // get position success
    p._onSuccess = function(position) {

        // clear
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
        this._element.innerHTML = error.message;
    };

    // Unload Map behaviour
    p._unload = function() {

        // call BehaviourBase unload method
        _parent.prototype._unload.call(this);

        // restore content
        this._element.innerHTML = this._inner;

    };

    return Map;

});