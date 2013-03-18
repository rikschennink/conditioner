
Namespace.register('ui').Clock = (function(){

    'use strict';

    // reference to parent class
    var _parent = conditioner.BehaviorBase;

    // Clock Class
    var Clock = function(element,options) {

        // set default options
        this._options = {
            'timestamp':false
        };

        // Call BehaviourBase constructor
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
        this._element.innerHTML = this._options.timestamp ? date.getTime() : date.toString();
        var self = this;
        this._timer = setTimeout(function(){
            self.tick();
        },1000);

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