/**
 * @module conditioner/BehaviorBase
 */
Namespace.register('conditioner').BehaviorBase = (function() {

    'use strict';



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
            this._options = Options.merge(this._options,options);
        }

        // merge custom options passed in data-options attribute
        var instanceOptions = this._element.getAttribute('data-options');
        if (instanceOptions) {
            var instanceOptionsObject;
            try {
                instanceOptionsObject = JSON.parse(instanceOptions);
            }
            catch(e) {
                throw new Error('BehaviorBase(element,options): "data-options" attribute needs to be in JSON format.');
            }
            this._options = Options.merge(this._options,instanceOptionsObject);
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