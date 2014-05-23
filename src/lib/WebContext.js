var TestWrapper = function(query,element,cb) {

    this._element = element;

    var expression = ExpressionParser.parse(query);

    this._condition = new Condition(expression,cb);

    this._load(expression);

};

TestWrapper.prototype = {

    _load:function(expression) {

        // get found test setups from expression and register
        var i= 0, tests = expression.getTests(),l=tests.length;
        for (;i<l;i++){
            this._setupMonitorForTest(tests[i]);
        }

    },

    _setupMonitorForTest:function(test) {

        var i=0,l,self=this;
        _monitorFactory.create(test,this._element).then(function(watches){

            // bind watches to test object
            test.assignWatches(watches);

            // add value watches
            l=watches.length;
            for(;i<l;i++) {

                // implement change method on watchers
                // jshint -W083
                watches[i].changed = self._condition.evaluate;

            }

            // do initial evaluation
            self._condition.evaluate();

        });

    },

    destroy:function() {



    }

};


var WebContext = {

    _uid:0,
    _tests:[],

    /**
     * Removes the given test from the test database and stops testing
     * @param {Number} id
     * @returns {Boolean}
     */
    clearTest:function(id) {

        // check if test with this id is available
        var test = this._tests[id];
        if (!test) {
            return false;
        }

        // destroy test
        this._tests[id] = null;
        test.destroy();

    },

    /**
     * Run test and call 'change' method if outcome changes
     * @param {String} query
     * @param {Element} element
     * @param {Function} cb
     * @returns {Number} test unique id
     */
    test:function(query,element,cb) {

        var id = this._uid++;

        // store test
        this._tests[id] = new TestWrapper(query,element,cb);

        // return the identifier
        return id;

        //var i=0,id=this._uid++,expression=ExpressionParser.parse(query),tests,condition,l;

        // create condition test container
        //var test =
        //new Condition(expression,change)
        //);

        /*
        condition = {

            // condition to evaluate on detect changes
            condition:new Condition(expression,change),

            // assert
            evaluate:function(){
                this.condition.evaluate();
            },

            // monitors
            monitors:[]

        };
        */

        // get found test setups from expression and register
        /*
        tests=expression.getTests();l=tests.length;
        for (;i<l;i++){
            this._setupMonitor(

                // test
                tests[i],

                // related element
                element,

                // re-evaluate this condition object on change
                condition

            );
        }

        // store test
        this._conditions[id] = condition;

        // return the identifier
        return id;
        */
    }

    /*,

    _setupMonitor:function(test,element,condition){

        var i=0,l;
        _monitorFactory.create(test,element).then(function(watches){

            // multiple watches
            test.assignWatches(watches);

            // add value watches
            l=watches.length;
            for(;i<l;i++) {

                // implement change method on watchers
                // jshint -W083
                watches[i].changed = condition.evaluate;

            }

            // do initial evaluation
            condition.evaluate();

        });

    }
    */

};