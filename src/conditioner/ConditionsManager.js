/**
 * @exports ConditionsManager
 * @class
 * @constructor
 * @param {string} conditions - conditions to be met
 * @param {element} [element] - optional element to measure these conditions on
 */
var ConditionsManager = function(conditions,element) {

    // if the conditions are suitable, by default they are
    this._suitable = true;

    // if no conditions, conditions will always be suitable
    if (typeof conditions !== 'string') {
        return;
    }

    // conditions supplied, conditions are now unsuitable by default
    this._suitable = false;

    // set element reference
    this._element = element;

    // change event bind
    this._onResultsChangedBind = this._onTestResultsChanged.bind(this);

    // returns the amount of expressions in this expression
    this._count = ExpressionFormatter.getExpressionsCount(conditions);

    // load to expression tree
    this._expression = ExpressionFormatter.fromString(conditions);

    // load tests to expression tree
    this._loadExpressionTests(this._expression.getConfig());
};

ConditionsManager.prototype = {

    /**
     * Returns true if the current conditions are suitable
     * @return {Boolean}
     * @public
     */
    getSuitability:function() {
        return this._suitable;
    },

    /**
     * Tests if conditions are suitable
     * @fires change
     * @public
     */
    test:function() {

        // test expression success state
        var suitable = this._expression.succeeds();

        // fire changed event if environment suitability changed
        if (suitable != this._suitable) {
            this._suitable = suitable;
            observer.publish(this,'change');
        }
    },

    /**
     * Loads test configurations contained in expressions
     * @param {Array} configuration
     * @private
     */
    _loadExpressionTests:function(configuration) {

        for (var i=0;i<configuration.length;i++) {

            if (Array.isArray(configuration[i])) {
                this._loadExpressionTests(configuration[i]);
                continue;
            }

            this._loadTesterToExpression(configuration[i].config,configuration[i].expression);
        }
    },

    /**
     * Loads a tester to supplied expression
     * @param {Object} config
     * @param {UnaryExpression} expression
     * @private
     */
    _loadTesterToExpression:function(config,expression) {

        var self = this;

        TestFactory.getTest(config.path,function(test) {

            // assign tester to expression
            expression.assignTester(
                new Tester(test,config.value,self._element)
            );

            // listen to test result updates
            observer.subscribe(test,'change',self._onResultsChangedBind);

            // lower test count
            self._count--;
            if (self._count===0) {
                self._onReady();
            }

        });
    },

     /**
     * Called when all tests are ready
     * @fires ready
     * @private
     */
    _onReady:function() {

        // test current state
        this.test();

        // we are now ready to start testing
        observer.publish(this,'ready',this._suitable);
    },

    /**
     * Called when a condition has changed
     * @private
     */
    _onTestResultsChanged:function() {
        this.test();
    }

};