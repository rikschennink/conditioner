
Namespace.register('ui').ClearField = (function(){

    "use strict";

    // reference to parent class
    var _parent = bc.core.BehaviourBase;

    /**
     * ClearField Class
     */
    var ClearField = function(element) {

        // Call BehaviourBase constructor
        _parent.call(this,element);

        // Add clear button
        var clearButton = document.createElement('button');
        clearButton.textContent = 'clear';
        clearButton.addEventListener('click',this);
        this._element.parentNode.insertBefore(clearButton,this._element);

    };

    // Extend from BehaviourBase
    var p = ClearField.prototype = Object.create(_parent.prototype);

    // Handle events
    p.handleEvent = function(e) {
        if (e.type === 'click') {
            this._element.value = '';
            this._element.focus();
            e.stopPropagation();
        }
    };

    // Unload ClearField behaviour
    p._unload = function() {

        // call BehaviourBase unload method
        _parent.prototype._unload.call(this);

        // get button reference
        var clearButton = this._element.previousSibling;

        // remove events
        clearButton.removeEventListener('click',this);

        // remove clear button
        this._element.parentNode.removeChild(clearButton);
    };

    return ClearField;

}());
