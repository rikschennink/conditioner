/**
 * Tests if what consent the user has given concerning cookie storage
 * @module tests/cookie
 */
define(['conditioner','security/StorageConsentGuard'],function(conditioner,StorageConsentGuard){

    return {
        arrange:function() {

            var guard = StorageConsentGuard.getInstance(),
                self = this;

            conditioner.Observer.subscribe(guard,'change',function() {
                self.act();
            });

        },
        assert:function(expected) {

            var guard = StorageConsentGuard.getInstance(),
                level = guard.getActiveLevel();

            return !!(expected.match(new RegExp(level,'g')));

        }
    };

});
