
/**
 * Constructs ConditionManager objects.
 * @class ConditionManager
 */
var ConditionManager = (function(TestManager){

    /**
     * @constructor
     * @param {object} expected - expected conditions to be met
     * @param {node} [element] - optional element to measure these conditions on
     */
    var ConditionManager = function(expected,element) {

        // if the conditions are suitable, by default they are
        this._suitable = true;

        // if no conditions, conditions will always be suitable
        if (!expected) {
            return;
        }

        // conditions supplied, conditions are now unsuitable by default
        this._suitable = false;

        // if expected is in string format try to parse as JSON
        if (typeof expected == 'string') {
            try {
                expected = JSON.parse(expected);
            }
            catch(e) {
                console.warn('ConditionManager(expected,element): expected conditions should be in JSON format.');
                return;
            }
        }

        // event bind
        this._onResultsChangedBind = this._onTestResultsChanged.bind(this);

        // set properties
        this._tests = [];

        // set conditions array
        this._count = 0;

        // parse expected
        var key;
        for (key in expected) {

            // skip if not own property
            if (!expected.hasOwnProperty(key)) {continue;}

            // up count
            this._count++;

            // load test for expectation with supplied key
            this._loadTest(key,expected,element);

        }
    };



    // prototype shortcut
    ConditionManager.prototype = {


        /**
         * Called to load a test
         * @method _loadTest
         * @param {string} key - Key related to the test to load
         * @param {object} expected - Expected value for this test
         * @param {node} [element] - Element related to this test
         */
        _loadTest:function(key,expected,element) {

            var self = this;

            TestManager.loadTestByKey(key,function(Test){

                //condition = new Condition(
                var test = new Test(expected[key],element);

                // add to tests array
                self._tests.push(test);

                // another test loaded
                self._onLoadTest();

            });
        },


        /**
         * Called when a test was loaded
         * @method _onLoadTest
         */
        _onLoadTest:function() {

            // lower count if test loaded
            this._count--;

            // if count reaches zero all tests have been loaded
            if (this._count==0) {
                this._onReady();
            }

        },

        /**
         * Called when all tests are ready
         * @method _onReady
         */
        _onReady:function() {

            var l = this._tests.length,test,i;
            for (i=0;i<l;i++) {
                test = this._tests[i];

                // arrange test
                test.arrange();

                // execute test
                test.assert();

                // listen to changes
                Observer.subscribe(test,'change',this._onResultsChangedBind);
            }

            // test current state
            this.test();
        },


        /**
         * Called when a condition has changed
         * @method _onConditionsChanged
         */
        _onTestResultsChanged:function() {
            this.test();
        },


        /**
         * Tests if conditions are suitable
         * @method test
         */
        test:function() {

            // check all conditions on suitability
            var suitable = true,l = this._tests.length,test,i;
            for (i=0;i<l;i++) {
                test = this._tests[i];
                if (!test.succeeds()) {
                    suitable = false;
                    break;
                }
            }

            // fire changed event if environment suitability changed
            if (suitable != this._suitable) {
                this._suitable = suitable;
                Observer.publish(this,'change');
            }

        },


        /**
         * Returns true if the current conditions are suitable
         * @method getSuitability
         */
        getSuitability:function() {
            return this._suitable;
        }
    };

    return ConditionManager;

}(TestManager));
