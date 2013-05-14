
var TestFactory = {

    _tests:[],

    _createTest:function(path,config) {

        if (!config.assert) {
            throw new Error('TestRegister._addTest(path,config): "config.assert" is a required parameter.');
        }

        // create Test Class
        var Test = function(){TestBase.call(this);};
        Test.prototype = Object.create(TestBase.prototype);

        // setup static methods and properties
        Test.supported = 'support' in config ? config.support() : true;

        Test._callbacks = [];
        Test._ready = false;

        Test._setup = function(test) {

            // if test is not supported stop here
            if (!Test.supported){return;}

            // push reference to test act method
            Test._callbacks.push(test.onchange.bind(test));

            // if setup done
            if (Test._ready) {return;}

            // Test is about to be setup
            Test._ready = true;

            // call test setup method
            config.setup.call(Test,Test._measure);

        };

        Test._measure = function(e) {

            // call change method if defined
            var changed = 'measure' in config ? config.measure.call(Test._measure,e) : true;

            // if result of measurement was a change
            if (changed) {
                var i=0,l=Test._callbacks.length;
                for (;i<l;i++) {
                    Test._callbacks[i](e);
                }
            }

        };

        // setup instance methods
        Test.prototype.supported = function() {
            return Test.supported;
        };

        // set change publisher
        Test.prototype.onchange = function() {
            Observer.publish(this,'change');
        };

        // set custom or default arrange method
        if (config.arrange) {
            Test.prototype.arrange = function(expected,element) {

                // if no support, don't arrange
                if (!Test.supported) {return;}

                // arrange this test using the supplied arrange method
                config.arrange.call(this,expected,element);
            };
        }
        else {
            Test.prototype.arrange = function() {
                Test._setup(this);
            };
        }

        // override act method if necessary
        if (config.measure) {
            Test.prototype.measure = config.measure;
        }

        // set assert method
        Test.prototype.assert = config.assert;

        // return reference
        return Test;
    },

    _findTest:function(path) {
        return this._tests[path];
    },

    _storeTest:function(path,Test) {
        this._tests[path] = Test;
    },

    getTest:function(path,found) {

        path = 'tests/' + path;

        require([path],function(config){

            var Test = TestFactory._findTest(path);
            if (!Test) {

                // create the test
                Test = TestFactory._createTest(path,config);

                // remember this test
                TestFactory._storeTest(path,Test);
            }

            found(new Test());

        });
    }
};