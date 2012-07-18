
/**
 * BehaviourBase abstract class.
 *
 * @class BehaviourBase
 */
(function() {

    /**
     * Constructs BehaviourBase objects.
     *
     * @class BehaviourBase
     * @constructor
     * @param {Object} element DOM Element
     */
    var BehaviourBase = function(element) {

        this._element = element;
        this._element.setAttribute('data-initialized', 'true');

    };

    /**
     * Unloads behaviour by removing data initialized property
     *
     * @class BehaviourBase
     * @method _unload
     */
    BehaviourBase.prototype._unload = function() {

        this._element.removeAttribute('data-initialized');
    };

    // Register class
    Namespace.register('bc.core').BehaviourBase = BehaviourBase;

}());