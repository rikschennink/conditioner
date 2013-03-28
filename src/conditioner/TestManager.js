/**
 * @module TestManager
 */
define(function(){

    return {

        _tests:{},

        /**
         * @method defineTest
         * @param {string} key - Test identifier
         * @param {function} path - The path to the test
         */
        registerTest:function(key,path) {

            if (!key || !path) {
                throw new Error('TestManager.defineTest(key,path): Both "key" and "path" are required parameters.');
            }

            this._tests[key] = path;
        },

        /**
         * @method loadTestByKey
         * @param {string} key - Test identifier
         * @param {Function} success - callback for when the test was loaded successfully
         */
        loadTestByKey:function(key,success) {

            if (!key || !success) {
                throw new Error('TestManager.getTestByKey(key,success): Both "key" and "success" are required parameters.');
            }

            // get path to test
            var path = this._tests[key] || 'conditioner/tests/' + key;

            // get test by key
            require([path],function(Test){
                success(Test);
            });

        }

    };

});
