var WebContext = {

    test:function(query,element,change) {

        var expression,condition,i,tests,l;

        // convert query to expression
        expression = ExpressionParser.parse(query);

        // condition to evaluate on detect changes
        condition = new Condition(expression,change);

        // get found test setups from expression and register
        i=0;tests=expression.getTests();l=tests.length;
        for (;i<l;i++){
            this._setupMonitor(

                // test
                tests[i],

                // related element
                element,

                // re-evaluate this condition on change
                condition

            );
        }

    },

    _setupMonitor:function(test,element,condition){

        var i=0,l;
        MonitorFactory.getInstance().create(test,element).then(function(watches){

            // multiple watches
            test.assignWatches(watches);

            // add value watches
            l=watches.length;
            for(;i<l;i++) {

                // listen to change event on the watchers
                // jshint -W083
                Observer.subscribe(watches[i],'change',function(){
                    condition.evaluate();
                });

            }

            // do initial evaluation
            condition.evaluate();

        });

    }

};