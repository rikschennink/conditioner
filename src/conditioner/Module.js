/**
 * @module BehaviorBase
 */
var Module = (function(updateObject) {

    /**
     * @class BehaviorBase
     * @constructor
     * @param {node} element - DOM Element to apply this behavior to
     * @param {object} [options] - Custom options to pass to this behavior
     */
    var Module = function(element,options) {

        // if no element, throw error
        if (!element) {
            throw new Error('BehaviorBase(element,options): "element" is a required parameter.');
        }

        // element reference
        this._element = element;
        this._element.setAttribute('data-initialized','true');

        // declare options as empty
        this._options = this._options || {};
        this._options = options ? updateObject(this._options,options) : this._options;

    };


    /**
     * Unloads behaviour by removing data initialized property
     * Override to clean up your control, remove event listeners, restore original state, etc.
     * @method _unload
     */
    Module.prototype._unload = function() {
        this._element.removeAttribute('data-initialized');
    };

    return Module;

}(updateObject));