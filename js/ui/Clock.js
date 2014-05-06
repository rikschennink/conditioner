define(function(){

    'use strict';

    // adds leading zero's
    var _pad = function(n){return n<10 ? '0'+n : n;};

    // Clock Class
    var exports = function(element,options) {

        // set default options
        this._element = element;
        this._options = options;

        // set time holder
        this._time = document.createElement('p');

        // start ticking
        this._tick();

        // add element
        this._element.appendChild(this._time);
    };

    // default options
    exports.options = {
        'time':true
    };

    // update time
    exports.prototype._tick = function() {

        var self = this,
            now = new Date(),
            date = _pad(now.getDate()) + '/' + (now.getMonth()+1) + '/'+ now.getFullYear(),
            time = _pad(now.getHours()) + ':' + _pad(now.getMinutes()) + ':' + _pad(now.getSeconds());

        // write inner html
        this._time.textContent = date + (this._options.time ? ' - ' + time : '');

        // if time is not enabled, don't start ticking
        if (!this._options.time) {
            return;
        }

        // wait timeout milliseconds till next clock tick
        this._timer = setTimeout(function(){
            self._tick();
        },900);

    };

    // unload clock
    exports.prototype.unload = function() {

        // stop ticking
        clearTimeout(this._timer);

        // restore content
        //this._element.innerHTML = this._inner;
        this._time.parentNode.removeChild(this._time);

    };

    return exports;

});