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

        // remember if loading
        this._loading = false;

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

        // now loading map
        this._loading = true;

        // set to loading
        this._element.innerHTML = 'Loading map';

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
        var self = this;
        var map = document.createElement('img');
        map.setAttribute('alt','');
        map.className = 'map';
        map.onload = function() {

            // if not loading don't append
            if (!self._loading) {
                return;
            }

            // append map image
            self._element.innerHTML = '';
            self._element.appendChild(map);
        };
        map.src = 'http://maps.googleapis.com/maps/api/staticmap?center=' + position.coords.latitude + ',' + position.coords.longitude + '&zoom=' + position.zoom + '&size=' + 500 + 'x' + 300 + '&maptype=roadmap&sensor=false';

    };

    // Unload Map behaviour
    p.unload = function() {

        // call ModuleBase unload method
        _parent.prototype.unload.call(this);

        // not loading anymore
        this._loading = false;

        // restore content
        this._element.innerHTML = this._inner;

    };

    return exports;

});