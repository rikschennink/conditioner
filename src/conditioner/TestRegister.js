
var TestRegister = {

    _register:[],

    _addTest:function(path,config) {

        if (!config.assert) {
            throw new Error('TestRegister._addTest(path,config): "config.assert" is a required parameter.');
        }

        // create Test Class
        var Test = function(){TestBase.call(this);};
        Test.prototype = Object.create(TestBase.prototype);

        // setup static methods and properties
        Test.supported = 'support' in config ? config.support() : true;
        Test.callbacks = [];

        Test._setup = function(test) {

            if (!Test.supported){return;}

            // push reference to test act method
            Test.callbacks.push(test.act.bind(test));

            // if setup done
            if (Test.callbacks.length>1) {return;}

            // call test setup method
            config.setup.call(Test,Test._onChange);

        };

        Test._onChange = function(e) {

            // call change method if defined
            var changed = 'change' in config ? config.change.call(Test,e,Test._onChange) : true;
            if (changed) {
                var i=0,l=Test.callbacks.length;
                for (;i<l;i++) {
                    Test.callbacks[i]();
                }
            }

        };

        // setup instance methods
        Test.prototype.supported = function() {
            return Test.supported;
        };

        // set custom or default arrange method
        if (config.arrange) {
            Test.prototype.arrange = config.arrange;
        }
        else {
            Test.prototype.arrange = function() {
                Test._setup(this);
            };
        }

        // override act method if necessary
        if (config.act) {
            Test.prototype.act = config.act;
        }

        // set assert method
        Test.prototype.assert = config.assert;

        // remember this test
        this._register[path] = Test;

        // return reference
        return Test;
    },

    getTest:function(path,found) {

        path = 'tests/' + path;

        require([path],function(config){

            var Test = TestRegister._register[path];
            if (!Test) {
                Test = TestRegister._addTest(path,config);
            }

            found(new Test());

        });

    }

};