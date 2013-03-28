

define(['./TestBase'],function(TestBase){

    var Test = TestBase.inherit(),
        p = Test.prototype;

    p.handleEvent = function(e) {
        this.assert();
    };

    p.arrange = function() {
        window.addEventListener('resize',this,false);
    };

    p._test = function(rule) {

        var innerWidth = window.innerWidth || document.documentElement.clientWidth;

        switch(rule.key) {
            case 'min-width':{
                return innerWidth >= rule.value;
            }
            case 'max-width':{
                return innerWidth <= rule.value;
            }
        }

        return true;
    };

    return Test;

});