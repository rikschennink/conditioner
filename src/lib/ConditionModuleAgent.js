var ConditionModuleAgent = function(conditions,element) {

    // if no conditions, conditions will always be suitable
    if (typeof conditions !== 'string' || !conditions.length) {
        return;
    }

    var self = this;
    this._state = false;

    WebContext.test(conditions,element,function(state){

        // something changed
        self._state = state;

        // notify others of this state change
        Observer.publish(self,'change');

    });


    // register
    /*
    TestPanel.test(conditions,element,function(state){

        // something changed

    });

    // tester
    this._tester = new Tester();
    this._tester.assign(conditions,element).next(

        // ready for testing
        function(){},

        // something went horribly wrong
        function(){}
    );
    */


    /*

    // conditions supplied, conditions are now unsuitable by default
    this._suitable = false;

    // remember tester references in this array for later removal
    this._testers = [];

    // change event bind
    this._onResultsChangedBind = this._onTestResultsChanged.bind(this);

    // returns the amount of expressions in this expression
    this._count = ExpressionFormatter.getExpressionsCount(conditions);

    // load to expression tree
    this._expression = ExpressionFormatter.fromString(conditions);

    // load tests to expression tree
    this._loadExpressionTests(this._expression.getConfig());

    */



};

ConditionModuleAgent.prototype = {

    /**
     * Returns true if the current conditions allow module activation
     * @return {Boolean}
     * @public
     */
    allowsActivation:function() {
        return this._state;
    },

    /**
     * Cleans up event listeners and readies object for removal
     */
    destroy:function() {

    }

    /**
     * Tests if conditions are suitable
     * @fires change

    _test:function() {

        // test expression success state
        var suitable = this._expression.succeeds();

        // fire changed event if environment suitability changed
        if (suitable != this._suitable) {
            this._suitable = suitable;
            Observer.publish(this,'change');
        }
    },
     */

    /**
     * Loads test configurations contained in expressions
     * @param {Array} configuration
     * @private

    _loadExpressionTests:function(configuration) {

        var i=0,l=configuration.length;

        for (;i<l;i++) {

            if (Array.isArray(configuration[i])) {
                this._loadExpressionTests(configuration[i]);
                continue;
            }

            this._loadTesterToExpression(configuration[i].config,configuration[i].expression);
        }
    },
     */

    /**
     * Loads a tester to supplied expression
     * @param {Object} config
     * @param {UnaryExpression} expression
     * @private
    _loadTesterToExpression:function(config,expression) {

        var self = this,tester;

        TestFactory.getTest(config.path,function(test) {

            // create a new tester instance for this test
            tester = new Tester(test,config.value,self._element);

            // remember tester
            self._testers.push(tester);

            // assign tester to expression
            expression.assignTester(tester);

            // listen to test result updates
            Observer.subscribe(test,'change',self._onResultsChangedBind);

            // lower test count so we know when we're ready
            self._count--;
            if (self._count===0) {
                self._onReady();
            }

        });
    },
     */

    /**
     * Called when all tests are ready
     * @fires ready
     * @private
    _onReady:function() {

        // test current state
        this._test();

        // we are now ready to start testing
        Observer.publish(this,'ready');
    },
     */

    /**
     * Called when a condition has changed
     * @private
    _onTestResultsChanged:function() {
        this._test();
    }
     */

};