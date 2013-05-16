/**
 * @exports ModuleBase
 * @class
 * @constructor
 * @param {element} element - DOM Element to apply this behavior to
 * @param {object} [options] - Custom options to pass to this module
 * @abstract
 */
var ModuleBase = function(element,options) {

    // if no element, throw error
    if (!element) {
        throw new Error('ModuleBase(element,options): "element" is a required parameter.');
    }

    /**
     * Reference to the element this module is active on
     * @type {element}
     * @protected
     */
    this._element = element;
    this._element.setAttribute('data-initialized','true');

    /**
     * Options in place for this module
     * @type {object}
     * @protected
     */
    this._options = this._options || {};
    this._options = options ? Utils.mergeObjects(this._options,options) : this._options;

};

/**
 * Unloads module by removing data initialized property
 * Override to clean up your control, remove event listeners, restore original state, etc.
 * @public
 */
ModuleBase.prototype.unload = function() {
    this._element.removeAttribute('data-initialized');
};