(function(){

    var factory = function(Observer,StorageConsentGuard){

        var _level = '';

        return {
            trigger:function(bubble){

                // listen to changes on storage guard
                var guard = StorageConsentGuard.getInstance();
                Observer.subscribe(guard,'change',function() {
                    _level = guard.getActiveLevel();
                    bubble();
                });

                // get default active level
                _level = guard.getActiveLevel();
            },
            parse:function(expected){
                return [{
                    'value':expected.split(',')
                }]
            },
            test:function(data){
                return data.expected.indexOf(_level) != -1;
            }
        };

    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(
            require('../utils/Observer'),
            require('security/StorageConsentGuard')
        );
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(['../utils/Observer',
                'security/StorageConsentGuard'],
            function(Observer,StorageConsentGuard){
                return factory(Observer,StorageConsentGuard);
            }
        );
    }

}());