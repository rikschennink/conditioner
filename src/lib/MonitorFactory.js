var MonitorFactory = (function(undefined){

    var MonitorFactory = function(){
        this._monitors = [];
        this._expressions = [];
    };

    MonitorFactory.prototype = {

        /**
         * Parse expression to deduct test names and expected values
         * @param expression
         * @returns {Array}
         */
        parse:function(expression) {

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
                    value:typeof parts[1] === 'undefined' ? true : parts[1]

                });
            }

            // remember the resulting array
            this._expressions[expression] = result;
            return result;
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
            _options.loader.load([_options.paths.monitors + '/' + path],function(setup) {

                var i=0,monitor = self._monitors[path],l,watch,watches,items,event;

                // bind trigger events for this setup if not defined yet
                if (!monitor) {

                    // setup
                    monitor = {

                        // bound watches (each watch has own data object)
                        watches: [],

                        // change method
                        change: function () {
                            i = 0;
                            l = monitor.watches.length;
                            for (; i < l; i++) {
                                monitor.watches[i].test();
                            }
                        }

                    };

                    // setup trigger events manually
                    if (typeof setup.trigger === 'function') {
                        setup.trigger(monitor.change, monitor.data);
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
                items = monitor.parse ? monitor.parse(expected) : self.parse(expected);
                l = items.length;

                for(;i<l;i++) {

                    watch = {

                        // default limbo state before we've done any tests
                        valid:null,

                        // setup data holder for this watcher
                        data:mergeObjects(
                            setup.data,{
                                element:element,
                                expected:typeof setup.test === 'function' ? items[i].test : items[i].value
                            }
                        ),

                        // run test
                        // jshint -W083
                        test:(function(fn){
                            return function() {
                                this.valid = fn(this.data);
                            };
                        }(typeof setup.test === 'function' ? setup.test : setup.test[items[i].test]))

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

    var _instance;
    return {
        getInstance:function(){
            if (!_instance){_instance = new MonitorFactory();}
            return _instance;
        }
    };

}());