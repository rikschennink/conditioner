define(['conditioner'],function(conditioner){

    'use strict';

    // reference to parent class
    var _parent = conditioner.ModuleBase;

    // Map Class
    var exports = function(element) {

        // Call ModuleBase constructor
        _parent.call(this,element);

        // backup content
        this._inner = this._element.innerHTML;

        // load map
        this._load(this._element.getAttribute('href'));
    };

    // Extend from ModuleBase
    var p = exports.prototype = Object.create(_parent.prototype);

    // get position success
    p._load = function(url) {

        if (!url) {
            return;
        }

        // setup lat lng
        var qs = url.match(/[\d]*\.?[\d]+/g),

        // setup position object
        position = {
            coords:{
                latitude:parseFloat(qs[0]),
                longitude:parseFloat(qs[1])
            },
            zoom:parseInt(qs[2],10)
        };

        // clear
        this._element.innerHTML = '<img src="http://maps.googleapis.com/maps/api/staticmap?center=' + position.coords.latitude + ',' + position.coords.longitude + '&zoom=' + position.zoom + '&size=' + 500 + 'x' + 300 + '&maptype=roadmap&sensor=false" alt="" class="map"/>';

    };

    // Unload Map behaviour
    p.unload = function() {

        // call ModuleBase unload method
        _parent.prototype.unload.call(this);

        // restore content
        this._element.innerHTML = this._inner;

    };

    return exports;

});