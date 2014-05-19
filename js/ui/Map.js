define(function(){

    'use strict';

    // Map Class
    var exports = function(element) {

        // set element reference
        this._element = element;

        // backup content
        this._inner = this._element.innerHTML;

        // remember if loading
        this._loading = false;

        // load map
        this._load(this._element.getAttribute('href'));
    };

    exports.prototype = {

        _load:function(url) {

            // url is a required param but will fail silently if not supplied
            if (!url) {return;}

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
            var self = this,
                style = '&style=feature:water|hue:0x00a1ff|saturation:-24&style=feature:road|element:labels|visibility:off&style=feature:administrative|element:labels|visibility:off&style=feature:landscape.natural|element:geometry.fill|saturation:-44|lightness:37|hue:0xf6ff00&style=feature:administrative.province|visibility:off&style=feature:poi|visibility:off&style=feature:transit|visibility:off&style=feature:water|element:labels|visibility:off',
                map = document.createElement('img');
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
            map.src = 'http://maps.googleapis.com/maps/api/staticmap?center=' + position.coords.latitude + ',' + position.coords.longitude + '&zoom=' + position.zoom + '&size=' + 500 + 'x' + 300 + '&maptype=roadmap&sensor=false' + style;

        },

        // Unload Map module
        unload:function() {

            // not loading anymore
            this._loading = false;

            // restore content
            this._element.innerHTML = this._inner;

        }
    };

    return exports;
});