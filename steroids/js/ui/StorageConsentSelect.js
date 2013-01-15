
Namespace.register('ui').StorageConsentSelect = (function(){

    'use strict';

    // reference to parent class
    var _parent = conditioner.BehaviorBase;

    /**
     * StorageConsentSelect Class
     */
    var StorageConsentSelect = function(element,options) {

        // default options for this class
        this._options = {
            'guard':null,
            'label':{
                'level':{},
                'select':'Cookies:'
            }
        };

        // Call BehaviourBase constructor
        _parent.call(this,element,options);

        // store inner HTML
        this._inner = this._element.innerHTML;

        // options
        var level,levels = this._options.label.level,html = '';
        for (level in levels) {
            if (!levels.hasOwnProperty(level)) {
                continue;
            }
            html += '<option value="' + level + '">' + this._options.label.level[level] + '</option>';
        }

        // setup select
        this._element.innerHTML = '<label for="storage-consent">' + this._options.label.select + '</label>' +
                                  '<select id="storage-consent">' + html + '</select>';

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