/**
 * @module conditioner/BehaviorBase
 */
Namespace.register('conditioner').BehaviorBase = (function() {

    'use strict';


    // todo: keep clone of original node

    // todo: dependencies?

    // todo: access to methods through behavior controller

    // todo: event dispatching link to behavior controller


    /**
     * Merges custom options passed for behavior with original behavior options
     * @method _mergeOptions
     * @param {Object} original - The original options
     * @param {Object} changes - The custom options
     */
    var _mergeOptions = function(original,changes) {

        // merge with custom generic options
        var key,change,result = {};
        for (key in original) {

            // needs to be own property and needs to be already available as an option
            if (!original.hasOwnProperty(key)) {
                continue;
            }

            // get change value
            change = changes[key];

            // merge
            if (typeof original[key] != 'object') {

                // set result value to changed value or original value
                result[key] = change || original[key];

            }
            else {

                // merge options on new level
                result[key] = _mergeOptions(original[key],change);

            }

        }

        return result;

    };



    /**
     * @class BehaviorBase
     * @constructor
     * @param {Element} element - DOM Element to apply this behavior to
     * @param {Object} options - Custom options to pass to this behavior
     */
    var BehaviorBase = function(element,options) {

        // element reference
        this._element = element;
        this._element.setAttribute('data-initialized','true');

        // declare options as empty if not already defined in subclass
        this._options = this._options || {};

        // merge additional options into options object
        this._options = _mergeOptions(this._options,options);

        // merge with options defined at node level
        var opts,key,i,levels,depth,name,attr,attributes = this._element.attributes;
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
     * @method _unload
     */
    BehaviorBase.prototype._unload = function() {

        this._element.removeAttribute('data-initialized');

    };

    // Register class
    return BehaviorBase;

}());