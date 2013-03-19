
Namespace.register('ui').Clock = (function(){

    'use strict';

    // reference to parent class
    var _parent = conditioner.BehaviorBase;

    // Clock Class
    var Clock = function(element,options) {

        // set default options
        this._options = {
            'seconds':true
        };

        // call BehaviourBase constructor
        _parent.call(this,element,options);

        // backup content
        this._inner = this._element.innerHTML;

        // start ticking
        this.tick();
    };

    // Extend from BehaviourBase
    var p = Clock.prototype = Object.create(_parent.prototype);

    // Update time
    p.tick = function() {
        var date = new Date();
        this._element.innerHTML = this._format(date.getHours()) + ':' + this._format(date.getMinutes()) + (this._options.seconds ? ':' + this._format(date.getSeconds()) : '');
        var self = this;
        this._timer = setTimeout(function(){
            self.tick();
        },this._options.seconds ? 900 : 59000);

    };

    // Add zero
    p._format = function(value) {
        return value<10 ? '0' + value : value;
    };

    // Unload Clock behaviour
    p._unload = function() {

        // call BehaviourBase unload method
        _parent.prototype._unload.call(this);

        // stop ticking
        clearTimeout(this._timer);

        // restore content
        this._element.innerHTML = this._inner;
    };

    return Clock;

}());