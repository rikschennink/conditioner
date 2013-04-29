
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

    // load tests
    this._tests = [];

    // change event bind
    this._onResultsChangedBind = this._onTestResultsChanged.bind(this);

    // returns the amount of expressions in this expression
    this._count = ExpressionFormatter.getExpressionsCount(conditions);

    // derive expression tree
    var expression = ExpressionFormatter.toExpressionTree(conditions);

    // load to expression tree
    this._expression = this._loadExpression(expression);

};



// prototype shortcut
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
     * Turns an expression array into an actual expression tree
     * @param expression {Array}
     * @return {ExpressionBase}
     * @private
     */
    _loadExpression:function(expression) {

        console.log('load:  ',expression);

        var exp=[],op,n;

        var i=0,l=expression.length;


        // if more than two items on this level mean binary expression

        // mean two unary expressions with possible negate statements


        /*


        for (;i<l;i++) {

            if (expression[i] instanceof Array) {

                this._loadExpression(expression[i]);

            }

        }


        // if expression is array
        if (expression.length === 3) {

            // is binary expression, create test
            return new BinaryExpression(
                this._loadExpression(expression[0]),
                expression[1],
                this._loadExpression(expression[2]),
                false
            );

        }
        else {
            return this._createUnaryExpressionFromTest(expression,false);
        }
        */

    },


    /**
     * Called to create a UnaryExpression from a test and loads the test
     * @param {object} test
     * @return {UnaryExpression}
     * @private
     */
    _createUnaryExpressionFromTest:function(test,negate) {

        var unaryExpression = new UnaryExpression(null,negate);
        var instance = null;
        var self = this;

        require(['tests/' + test.path],function(Test){

            // create test instance
            instance = new Test(test.value,self._element);

            // add instance to test set
            self._tests.push(instance);

            // set test to unary expression
            unaryExpression.setTest(instance);

            // lower test count
            self._count--;
            if (self._count===0) {
                self._onReady();
            }
        });

        return unaryExpression;
    },


    /**
     * Called when all tests are ready
     * @fires ready
     * @private
     */
    _onReady:function() {

        // setup
        var l = this._tests.length,test,i;
        for (i=0;i<l;i++) {

            test = this._tests[i];

            // arrange test (tests will assert themselves)
            test.arrange();

            // assert test to determine initial state
            test.assert();

            // listen to changes
            Observer.subscribe(test,'change',this._onResultsChangedBind);
        }

        // test current state
        this.test();

        // we are now ready to start testing
        Observer.publish(this,'ready',this._suitable);

    },


    /**
     * Called when a condition has changed
     * @private
     */
    _onTestResultsChanged:function() {
        this.test();
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
            Observer.publish(this,'change');
        }

    }

};
