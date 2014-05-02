var MonitorFactory = function(){
    this._monitors = [];
    this._expressions = [];
};

MonitorFactory.prototype = {

    /**
     * Parse expression to deduct test names and expected values
     * @param {String} expression
     * @param {Boolean} isSingleTest - is true when only one test is defined, in that case only value can be returned
     * @returns {*}
     */
    _parse:function(expression,isSingleTest) {

        // if earlier parse action found return that one
        if (this._expressions[expression]) {
            return this._expressions[expression];
        }

        // parse expression
        var i=0,expressions=expression.split(','),l=expressions.length,result=[],parts;
        for(;i<l;i++) {
            parts=expressions[i].split(':');
            result.push({

                // test name
                test:parts[0],

                // expected custom value or expect true by default
                value:isSingleTest ? parts[0] : typeof parts[1] === 'undefined' ? true : parts[1]

            });
        }

        // remember the resulting array
        this._expressions[expression] = result;
        return result;
    },

    _mergeData:function(base,expected,element){
        return mergeObjects(
            {
                element:element,
                expected:expected
            },
            base
        );
    },

    /**
     * Create a new Monitor based on passed configuration
     * @param {Test} test
     * @param {Element} element
     * @returns {Promise}
     */
    create:function(test,element){

        // setup promise
        var p = new Promise();

        // path to monitor
        var path = test.getPath();

        // expected value
        var expected = test.getExpected();

        // load monitor configuration
        var self = this;
        _options.loader.require([_options.paths.monitors + '/' + path],function(setup) {

            var i=0,monitor = self._monitors[path],l,watch,watches,items,event,item,data,isSingleTest;

            // bind trigger events for this setup if not defined yet
            if (!monitor) {

                // setup
                monitor = {

                    // bound watches (each watch has own data object)
                    watches: [],

                    // change method
                    change:function () {
                        i = 0;
                        l = monitor.watches.length;
                        for (; i<l; i++) {
                            monitor.watches[i].test();
                        }
                    }

                };

                // data holder
                data = setup.unique ? self._mergeData(setup.data,expected,element) : setup.data;

                // setup trigger events manually
                if (typeof setup.trigger === 'function') {
                    setup.trigger(monitor.change,data);
                }

                // auto bind trigger events
                else {
                    for (event in setup.trigger) {
                        if (!setup.trigger.hasOwnProperty(event)) {continue;}
                        setup.trigger[event].addEventListener(event, monitor.change, false);
                    }
                }

                // test if should remember this monitor or should create a new one on each match
                if (!setup.unique) {
                    self._monitors[path] = monitor;
                }
            }

            // add watches
            watches = [];

            // deduce if this setup contains a single test or has a mutiple test setup
            // this is useful to determine parsing setup and watch configuration later on
            isSingleTest = typeof setup.test === 'function';

            // does the monitor have an own custom parse method or should we use the default parse method
            items = setup.parse ? setup.parse(expected,isSingleTest) : self._parse(expected,isSingleTest);

            // cache the amount of items
            l = items.length;

            for(;i<l;i++) {

                item = items[i];

                watch = {

                    // default limbo state before we've done any tests
                    valid:null,

                    // setup data holder for this watcher
                    data:setup.unique ? data : self._mergeData(setup.data,item.value,element),

                    // setup test method to use
                    // jshint -W083
                    test:(function (fn) {
                        if (!fn) {
                            throw new Error('Conditioner: Test "' + item.test + '" not found on "' + path + '" Monitor.');
                        }
                        return function () {
                            var state = fn(this.data);
                            if (this.valid!=state) {
                                this.valid =state;
                                Observer.publish(this,'change');
                            }
                        };
                    }(isSingleTest ? setup.test : setup.test[item.test]))

                };

                // run initial test so we have start state
                watch.test();

                // we need to return it for later binding
                watches.push(watch);
            }

            // add these new watches to the already existing watches so they receive trigger updates
            monitor.watches = monitor.watches.concat(watches);

            // resolve with the new watches
            p.resolve(watches);

        });

        return p;

    }
};