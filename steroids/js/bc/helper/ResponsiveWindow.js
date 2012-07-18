
(function() {

    // reference to first instance
    var _instance;

    /**
     * Constructs ResponsiveWindow singleton.
     *
     * @class ResponsiveWindow
     * @constructor
     */
    var ResponsiveWindow = function()
    {
        if (!_instance) {_instance = this;}
        else {return _instance;}

        this._timer = null;

        // Listen to window resize event
        window.addEventListener('resize',this);
    };

    var p = ResponsiveWindow.prototype;

    /**
     * Handles events.
     *
     * @class ResponsiveWindow
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
     * @class ResponsiveWindow
     * @method _onResize
     */
    p._onResize = function()
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
     * @class ResponsiveWindow
     * @method _onStable
     */
    p._onStable = function() {
        bc.helper.Observer.fire(this,'resize');
    };

    // Register class
    Namespace.register('bc.helper').ResponsiveWindow = ResponsiveWindow;

}());


