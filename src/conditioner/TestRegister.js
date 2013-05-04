
var TestRegister = {

    _register:[],

    _addTest:function(path,config) {

        // create Test class
        var Test = function(){TestBase.call(this);};
        Test.prototype = Object.create(TestBase.prototype);

        // setup methods
        if (config.assert) {
            Test.prototype['assert'] = config.assert;
        }
        if (config.act) {
            Test.prototype['act'] = config.act;
        }
        if (config.arrange) {
            Test.prototype['arrange'] = config.arrange;
        }

        // arrange the test
        var test = new Test();
        test.arrange();

        this._register[path] = test;

    },

    getTest:function(path,found) {

        var self = this;

        path = 'tests/' + path;

        require([path],function(config){

            if (!self._register[path]) {
                self._addTest(path,config);
            }

            found(self._register[path]);

        });

    }

};