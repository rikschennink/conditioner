/**
 * Tests if what consent the user has given concerning cookie storage
 * @module tests/cookie
 */
define(['conditioner','security/StorageConsentGuard'],function(conditioner,StorageConsentGuard){

    var _level = '';

    return {

        setup:function(change) {

            // listen to changes on storage guard
            var guard = StorageConsentGuard.getInstance();
            conditioner.Observer.subscribe(guard,'change',function() {
                change();
            });

            // get active level
            _level = guard.getActiveLevel();
        },

        change:function() {

            // get guard reference
            var guard = StorageConsentGuard.getInstance();

            // get active level now it has changed
            var newLevel = guard.getActiveLevel();

            // if changed
            if (newLevel !== _level) {
                _level = newLevel;
                return true;
            }

            return false;
        },

        assert:function(expected) {
            return !!(expected.match(new RegExp(_level,'g')));
        }
    };

});
