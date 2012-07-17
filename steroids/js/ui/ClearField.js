
/*
 * ClearField Class
 */
(function(){

    var ClearField = function(element) {

        // Call BehaviourBase constructor
        bc.core.BehaviourBase.call(this,element);

        // Add clear button
        var clearButton = document.createElement('button');
        clearButton.textContent = 'clear';
        clearButton.addEventListener('click',this);
        this._element.parentNode.insertBefore(clearButton,this._element);

    };

    // Extend from BehaviourBase
    var p = ClearField.prototype = Object.create(bc.core.BehaviourBase.prototype);

    // Handle events
    p.handleEvent = function(e) {
        if (e.type === 'click') {
            this._element.value = '';
        }
    };

    // Unload ClearField behaviour
    p._unload = function() {

        // call BehaviourBase unload method
        bc.core.BehaviourBase.prototype._unload.call(this);

        // get button reference
        var clearButton = this._element.previousSibling;

        // remove events
        clearButton.removeEventListener('click',this);

        // remove clear button
        this._element.parentNode.removeChild(clearButton);
    };

    Namespace.register('ui').ClearField = ClearField;

}());
