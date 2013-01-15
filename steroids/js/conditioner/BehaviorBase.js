
/**
 * BehaviorBase Abstract Class.
 *
 * @class BehaviorBase
 */
Namespace.register('conditioner').BehaviorBase = (function() {

    'use strict';


    // todo: merge options with custom options via data attribute

    // todo: keep clone of original node

    // todo: dependencies?

    // todo: access to methods via behavior controller

    // todo: event dispatching link to behavior controller


    /**
     * Constructs BehaviorBase objects.
     *
     * @class BehaviorBase
     * @constructor
     * @param {Element} element DOM Element
     */
    var BehaviorBase = function(element,options) {

        // element reference
        this._element = element;
        this._element.setAttribute('data-initialized','true');

        // declare options as empty if not already defined in subclass
        this._options = this._options || {};

        // merge with custom generic options
        var key,opts = this._options;
        for (key in options) {

            // needs to be own property and needs to be already available as an option
            if (!options.hasOwnProperty(key) || !opts[key]) {
                continue;
            }

            // merge

            // todo: write merge code!




        }


        // merge with options defined at node level
        var i,levels,depth,name,attr,attributes = this._element.attributes;
        for (key in attributes) {

            if (!attributes.hasOwnProperty(key)) {
                continue;
            }

            // et attribute reference
            attr = attributes[key];
            name = attr.name;

            // skip non data attributes
            if (!name || name.indexOf('data-')!=0) {
                continue;
            }

            // strip data part
            name = name.substr(5);
            levels = name.split('-');
            depth = levels.length;
            opts = this._options;

            for (i=0;i<depth; i++) {

                // if option not available
                if (typeof opts[levels[i]] == 'undefined') {
                    opts = null;
                    break;
                }

                // if not is last level go to sub level
                if (i<depth-1) {
                    opts = opts[levels[i]];
                }
                else {
                    opts[levels[i]] = attr.value;
                }
            }

        }


    };


    /**
     * Unloads behaviour by removing data initialized property
     *
     * @class BehaviorBase
     * @method _unload
     */
    BehaviorBase.prototype._unload = function() {

        this._element.removeAttribute('data-initialized');

    };

    // Register class
    return BehaviorBase;

}());