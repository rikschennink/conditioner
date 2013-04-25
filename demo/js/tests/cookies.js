/**
 * Tests if what consent the user has given concerning cookie storage
 * @module tests/cookie
 */
define(['Conditioner','security/StorageConsentGuard'],function(Conditioner,StorageConsentGuard){

    var Test = Conditioner.Test.inherit(),
        p = Test.prototype;

    p.arrange = function() {

        var guard = StorageConsentGuard.getInstance(),self = this;
        Conditioner.Observer.subscribe(guard,'change',function() {
            self.assert();
        });

    };

    p._test = function(expected) {

        var guard = StorageConsentGuard.getInstance(),
            level = guard.getActiveLevel(),
            result = expected.match(new RegExp(level,'g'));

        return result ? true : false;
    };

    return Test;

});
