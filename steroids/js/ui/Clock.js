
/*
 * Clock Class
 */
(function(){

    var Clock = function(element) {

        // Call BehaviourBase constructor
        bc.core.BehaviourBase.call(this,element);

        // backup content
        this._inner = this._element.innerHTML;

        // start ticking
        this.tick();
    };

    // Extend from BehaviourBase
    var p = Clock.prototype = Object.create(bc.core.BehaviourBase.prototype);

    // Update time
    p.tick = function() {
        this._element.textContent = new Date();
        var self = this;
        this._timer = setTimeout(function(){
            self.tick();
        },1000);
    };

    // Unload Clock behaviour
    p._unload = function() {

        // call BehaviourBase unload method
        bc.core.BehaviourBase.prototype._unload.call(this);

        // stop ticking
        clearTimeout(this._timer);

        // restore content
        this._element.innerHTML = this._inner;
    };

    Namespace.register('ui').Clock = Clock;

}());