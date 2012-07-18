
/**
 * BehaviourEnvironment
 *
 * @class BehaviourEnvironment
 */
(function() {

    /**
     * Constructs BehaviourEnvironment objects.
     * Should only be called from create method.
     *
     *  data-environment JSON specification
     *  {
     *      "window":{
     *          "minWidth":<Number>,
     *          "maxWidth":<Number>
     *      }
     *  }
     *
     * @class BehaviourEnvironment
     * @constructor
     * @param {Object} element DOM Element
     */
    var BehaviourEnvironment = function(element,properties) {

        // is the environment suitable, by default it is
        this._suitable = true;

        // set properties object
        this._properties = properties;

        // listen for environment changes
        this._listen();

        // test the environment
        this._test();
    
    };

    /**
     * Static method construct behaviour environment objects
     *
     * @class BehaviourEnvironment
     * @method construct
     */
    BehaviourEnvironment.construct = function(element) {

        // check if has specifications
        var specifications = element.getAttribute('data-environment');
        if (!specifications) {
            return null;
        }
    
        var properties = null;
        try {
            properties = JSON.parse(specifications);
        }
        catch(e) {
            console.warn("BehaviourEnvironment: data-environment attribute should have format data-environment='{\"foo\":\"bar\"}'");
            return null;
        }
    
        return new bc.core.BehaviourEnvironment(element,properties)
    
    };


    // prototype shortcut
    var p = BehaviourEnvironment.prototype;


    /**
     * Adds listeners to the environment to act when it changes
     *
     * @class BehaviourEnvironment
     * @method _listen
     */
    p._listen = function() {

        if (this._properties.window) {
            var responsiveWindow = new bc.helper.ResponsiveWindow();
            bc.helper.Observer.subscribe(responsiveWindow,'resize',this._test.bind(this));
        }

    };


    /**
     * Checks if the current environment has the requested properties
     *
     * @class BehaviourEnvironment
     * @method _test
     */
    p._test = function() {

        // test environment properties
        var win,windowSize,suitable = true;

        // test window sizes
        if (win = this._properties.window) {

            // get window size
            windowSize = {x:window.innerWidth,y:0};

            // check max width
            if (win.maxWidth && windowSize.x > win.maxWidth) {
                suitable = false;
            }

            // check min width
            if (win.minWidth && windowSize.x < win.minWidth) {
                suitable = false;
            }

        }

        // fire changed event if environment suitability changed
        if (suitable != this._suitable) {
            this._suitable = suitable;
            bc.helper.Observer.fire(this,'change');
        }
    };

    /**
     * Returns the suitability of the current environment
     *
     * @class BehaviourEnvironment
     * @method isSuitable
     * @return {Boolean} The suitability of the environment
     */
    p.isSuitable = function() {
        return this._suitable;
    };

    // Register class
    Namespace.register('bc.core').BehaviourEnvironment = BehaviourEnvironment;

}());