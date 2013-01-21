/**
 * @module conditioner/BehaviorBase
 */
Namespace.register('conditioner').BehaviorBase = (function() {

    'use strict';


    // todo: dependencies?


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

            if (!changes) {
                result[key] = original[key];
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

        // if no element, throw error
        if (!element) {
            throw new Error('BehaviorBase(element,options): "element" is a required parameter.');
        }

        // element reference
        this._element = element;
        this._element.setAttribute('data-initialized','true');

        // declare options as empty if not already defined in subclass
        this._options = this._options || {};

        // merge additional options into options object if supplied
        if (options) {
            this._options = _mergeOptions(this._options,options);
        }

        // merge custom options passed in data-options attribute
        var instanceOptions = this._element.getAttribute('data-options');
        if (instanceOptions) {
            try {
                var instanceOptionsObject = JSON.parse(instanceOptions);
            }
            catch(e) {
                throw new Error('BehaviorBase(element,options): "data-options" attribute needs to be in JSON format.');
            }
            this._options = _mergeOptions(this._options,instanceOptionsObject);
        }

    };


    /**
     * Unloads behaviour by removing data initialized property
     * Override to clean up your control, remove event listeners, restore original state, etc.
     * @method _unload
     */
    BehaviorBase.prototype._unload = function() {

        this._element.removeAttribute('data-initialized');

    };

    return BehaviorBase;

}());