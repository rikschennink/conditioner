
define(['conditioner/tests/TestBase','conditioner/Observer','security/StorageConsentGuard'],function(TestBase,Observer,StorageConsentGuard){

    var Test = TestBase.inherit(),
        p = Test.prototype;

    p.arrange = function() {

        var guard = StorageConsentGuard.getInstance();

        var self = this;
        Observer.subscribe(guard,'change',function() {
            self.assert();
        });
    };

    p._test = function(rule) {

        var guard = StorageConsentGuard.getInstance(),
            level = guard.getActiveLevel();

        return rule.value.indexOf(level) > -1;

    };

    return Test;

});
