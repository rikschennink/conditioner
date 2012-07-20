
/*
 * Map Class
 */
(function(){

    var Map = function(element) {

        // Call BehaviourBase constructor
        bc.core.BehaviourBase.call(this,element);

        // backup content
        this._inner = this._element.innerHTML;

        // loading map
        this._element.innerHTML = 'Loading map..';

        // get position
        navigator.geolocation.getCurrentPosition(this._success.bind(this),this._error.bind(this));
    };

    // Extend from BehaviourBase
    var p = Map.prototype = Object.create(bc.core.BehaviourBase.prototype);

    // get position success
    p._success = function(position) {

        // clear
        this._element.innerHTML = '';

        // append map
        var image = document.createElement('img');
        image.src = 'http://maps.googleapis.com/maps/api/staticmap?center=' + position.coords.latitude + ',' + position.coords.longitude + '&zoom=14&size=' + 500 + 'x' + 300 + '&maptype=roadmap&sensor=false';
        image.alt = '';
        image.style.maxWidth = '100%';
        this._element.appendChild(image);
    };

    // get position success fail
    p._error = function(msg) {
        this._element.innerHTML = msg;
    };

    // Unload Clock behaviour
    p._unload = function() {

        // call BehaviourBase unload method
        bc.core.BehaviourBase.prototype._unload.call(this);

        // restore content
        this._element.innerHTML = this._inner;
    };

    Namespace.register('ui').Map = Map;

}());