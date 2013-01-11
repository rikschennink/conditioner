
/**
 * BehaviorBase abstract class.
 *
 * @class BehaviorBase
 */
Namespace.register('conditioner').BehaviorBase = (function() {

    'use strict';


    // todo: merge options with custom options via data attribute

    // todo: keep clone of original node


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
        this._element.setAttribute('data-initialized', 'true');

        // options reference
        this._options = options;

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