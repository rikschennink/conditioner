
(function() {

    var _singleton;

    /**
     * Constructs BehaviourController singleton objects.
     *
     * @class BehaviourController
     * @constructor
     */
    var ResponsiveWindow = function()
    {
        if (!_singleton) {_singleton = this;}
        else {return _singleton;}

        this._timer = null;

        // Listen to window resize event
        window.addEventListener('resize',this);
    };

    var p = ResponsiveWindow.prototype;

    /**
     * Handles events.
     *
     * @method handleEvent
     */
    p.handleEvent = function(e)
    {
        if (e.type === 'resize')
        {
            this._onResize();
        }
    };

    /**
     * On resize event handler, delays events.
     *
     * @method _onResize
     */
    p._onResize = function(e)
    {
        clearTimeout(this._timer);

        var self = this;

        this._timer = setTimeout(function() {
            self._onStable();
        },100);
    };

    /**
     * Dispatches resize event.
     *
     * @method _onStable
     */
    p._onStable = function() {
        bc.helper.Observer.fire(this,'resize');
    };

    // Register class
    Namespace.register('bc.helper').ResponsiveWindow = ResponsiveWindow;

}());


