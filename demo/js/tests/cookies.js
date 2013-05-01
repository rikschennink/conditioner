/**
 * Tests if what consent the user has given concerning cookie storage
 * @module tests/cookie
 */
define(['conditioner','security/StorageConsentGuard'],function(conditioner,StorageConsentGuard){

    var exports = conditioner.TestBase.inherit(),
        p = exports.prototype;

    p.arrange = function() {

        var guard = StorageConsentGuard.getInstance(),self = this;
        conditioner.Observer.subscribe(guard,'change',function() {
            self.assert();
        });

    };

    p._onAssert = function(expected) {

        var guard = StorageConsentGuard.getInstance(),
            level = guard.getActiveLevel(),
            result = expected.match(new RegExp(level,'g'));

        return result ? true : false;
    };

    return exports;

});
