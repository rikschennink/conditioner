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

        console.log('jaj!');

        if (!url) {
            return;
        }

        // setup lat lng
        var coordinates = url.match(/[\d]*[.][\d]+/g),
        position = {
            coords:{
                latitude:parseFloat(coordinates[0]),
                longitude:parseFloat(coordinates[1])
            },
            zoom:11
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