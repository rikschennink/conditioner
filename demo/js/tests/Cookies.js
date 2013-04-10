define(['Conditioner','../security/StorageConsentGuard'],function(Conditioner,StorageConsentGuard){

    var Test = Conditioner.Test.inherit(),
        p = Test.prototype;

    p.arrange = function() {

        var guard = StorageConsentGuard.getInstance();

        var self = this;
        Conditioner.Observer.subscribe(guard,'change',function() {
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