
/**
 * @class ConditionsManager
 */
var ConditionsManager = (function(require){


    /**
     * @class UnaryExpression
     * @constructor
     * @param {Test || BinaryExpression} a - expression
     * @param {string} o - operator (and|or)
     */
    var UnaryExpression = function(a,o) {

        this._a = a;
        this._o = o;

    };

    UnaryExpression.prototype.equals = function(value) {



    };


    /**
     * @class BinaryExpression
     * @constructor
     * @param {Test || BinaryExpression || UnaryExpression} a - expression
     * @param {string} o - operator (and|or)
     * @param {Test || BinaryExpression || UnaryExpression} b - expression
     */
    var BinaryExpression = function(a,o,b) {

        this._a = a;
        this._o = o;
        this._b = b;

    };

    BinaryExpression.prototype.equals = function(value) {



    };





    // helper method
    var makeImplicit = function(level) {

        var i=0,l=level.length;

        for (;i<l;i++) {

            if (l>3) {

                // binary expression found merge into new level
                level.splice(i,3,level.slice(i,i+3));

                // set new length
                l = level.length;

                // move back to start
                i=-1;

            }
            else if (typeof level[i] !== 'string') {

                // level okay, check lower level
                makeImplicit(level[i]);

            }

        }

    };

    // helper method
    var parseCondition = function(condition) {

        var i=0,
            c,
            k,
            n,
            operator,
            name = '',
            tree = [],
            value = '',
            isValue = false,
            target = null,
            flattened = null,
            parent = null,
            parents = [],
            l=condition.length;


        if (!target) {
            target = tree;
        }

        // read explicit expressions
        for (;i<l;i++) {

            c = condition.charAt(i);

            // check if an expression
            if (c === '{') {

                // now reading the expression
                isValue = true;

                // reset name var
                name = '';

                // fetch name
                k = i-2;
                while(k>=0) {
                    n = condition.charAt(k);
                    if (n === ' ' || n === '(') {
                        break;
                    }
                    name = n + name;
                    k--;
                }

                // on to the next character
                continue;

            }
            else if (c === '}') {

                // add value and
                target.push(name + ':' + value);

                // reset vars
                name = '';
                value = '';

                // no longer a value
                isValue = false;

                // on to the next character
                continue;
            }

            // if we are reading an expression add characters to expression
            if (isValue) {
                value += c;
                continue;
            }

            // if not in expression
            if (c === ' ') {

                // get operator
                operator = condition.substr(i,4).match(/and|or/g);

                // if operator found
                if (operator) {

                    // add operator
                    target.push(operator[0]);

                    // skip over operator
                    i+=operator[0].length+1;
                }

                continue;
            }

            // check if goes up a level
            if (c === '(') {

                // create new empty array in target
                target.push([]);

                // remember current target (is parent)
                parents.push(target);

                // set new child slot as new target
                target = target[target.length-1];

            }
            else if (c === ')' || i === l-1) {

                // reset flattened data
                flattened = null;

                // get parent
                parent = parents.pop();

                // if only contains single element flatten array
                if (target.length === 1 || (parent && parent.length===1 && i===l-1)) {
                    flattened = target.concat();
                }

                // restore parent
                target = parent;

                // if data defined
                if (flattened && target) {

                    target.pop();

                    for (k=0;k<flattened.length;k++) {
                        target.push(flattened[k]);
                    }

                }

            }
        }

        // derive implicit expressions
        makeImplicit(tree);

        // return final expression tree
        return tree;
    };






    /**
     * @constructor
     * @param {object} expected - expected conditions to be met
     * @param {Element} [element] - optional element to measure these conditions on
     */
    var ConditionsManager = function(expected,element) {

        // if the conditions are suitable, by default they are
        this._suitable = true;

        // if no conditions, conditions will always be suitable
        if (typeof expected !== 'string') {
            return;
        }

        // conditions supplied, conditions are now unsuitable by default
        this._suitable = false;



        console.log('expected:',expected);
        console.log('result:',parseCondition(expected));

        return;

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
    ConditionsManager.prototype = {

        /**
         * Returns true if the current conditions are suitable
         * @method getSuitability
         */
        getSuitability:function() {
            return this._suitable;
        },


        /**
         * Called to load a test
         * @method _loadTest
         * @param {string} path - path to the test module
         * @param {object} expected - Expected value for this test
         * @param {node} [element] - Element related to this test
         */
        _loadTest:function(path,expected,element) {

            var self = this;

            require(['tests/' + path],function(Test){

                //condition = new Condition(
                var test = new Test(expected[path],element);

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

            // setup
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

            // we are now ready to start testing
            Observer.publish(this,'ready',this._suitable);

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

        }

    };

    return ConditionsManager;

}(require));
