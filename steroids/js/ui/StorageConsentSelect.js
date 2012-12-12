
Namespace.register('ui').StorageConsentSelect = (function(){

    "use strict";

    // reference to parent class
    var _parent = bc.core.BehaviourBase;

    /**
     * StorageConsentSelect Class
     */
    var StorageConsentSelect = function(element) {

        // Call BehaviourBase constructor
        _parent.call(this,element);

        // store inner HTML
        this._inner = this._element.innerHTML;

        // options
        var level,options = '',levels = security.StorageConsentGuard.getInstance().getLevels();
        for (level in levels) {
            options += '<option value="' + level + '">' + levels[level] + '</option>';
        }

        // setup select
        this._element.innerHTML = '<label for="storage-allowed">Allow cookies:</label>' +
                                  '<select id="storage-allowed">' + options + '</select>';

        // listen to changes on select
        this._element.querySelector('select').addEventListener('change',this);

    };

    // Extend from BehaviourBase
    var p = StorageConsentSelect.prototype = Object.create(_parent.prototype);

    // Handle events
    p.handleEvent = function(e) {
        if (e.type === 'change') {
            var select = this._element.querySelector('select'),
                value = select.options[select.selectedIndex].value,
                guard = security.StorageConsentGuard.getInstance();
                guard.setActiveLevel(value);
        }
    };

    // Unload StorageConsentSelect behaviour
    p._unload = function() {

        // call BehaviourBase unload method
        _parent.prototype._unload.call(this);

        // remove event listener
        this._element.querySelector('select').removeEventListener('change',this);

        // restore original content
        this._element.innerHTML = this._inner;

    };

    return StorageConsentSelect;

}());