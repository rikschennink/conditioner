

    /*!
     * contentloaded.js
     *
     * Author: Diego Perini (diego.perini at gmail.com)
     * Summary: cross-browser wrapper for DOMContentLoaded
     * Updated: 20101020
     * License: MIT
     * Version: 1.2
     *
     * URL:
     * http://javascript.nwbox.com/ContentLoaded/
     * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
     * https://github.com/dperini/ContentLoaded
     *
     */

// @win window reference
// @fn function reference
var contentLoaded = function(win, fn) {

    var done = false, top = true,

        doc = win.document, root = doc.documentElement,

        add = 'attachEvent',
        rem = 'detachEvent',
        pre = 'on',

        init = function(e) {
            if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
            (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
            if (!done && (done = true)) fn.call(win, e.type || e);
        },

        poll = function() {
            try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
            init('poll');
        };

    if (doc.readyState == 'complete') fn.call(win, 'lazy');
    else {
        if (doc.createEventObject && root.doScroll) {
            try { top = !win.frameElement; } catch(e) { }
            if (top) poll();
        }
        doc[add](pre + 'DOMContentLoaded', init, false);
        doc[add](pre + 'readystatechange', init, false);
        win[add](pre + 'load', init, false);
    }

};
define("shim/DOMContentLoaded", function(){});

// addEventListener for IE8
// https://gist.github.com/jonathantneal/3748027
//
!window.addEventListener && (function (windowObject,WindowPrototype, DocumentPrototype, ElementPrototype, addEventListener, removeEventListener, dispatchEvent, registry) {
	WindowPrototype[addEventListener] = DocumentPrototype[addEventListener] = ElementPrototype[addEventListener] = function (type, listener) {

		if (type == 'DOMContentLoaded' && contentLoaded) {
			contentLoaded(windowObject,listener);
			return;
		}

		var target = this;

		registry.unshift([target, type, listener, function (event) {
			event.currentTarget = target;
			event.preventDefault = function () { event.returnValue = false };
			event.stopPropagation = function () { event.cancelBubble = true };
			event.target = event.srcElement || target;

			listener.call(target, event);
		}]);

		this.attachEvent("on" + type, registry[0][3]);
	};

	WindowPrototype[removeEventListener] = DocumentPrototype[removeEventListener] = ElementPrototype[removeEventListener] = function (type, listener) {
		for (var index = 0, register; register = registry[index]; ++index) {
			if (register[0] == this && register[1] == type && register[2] == listener) {
				return this.detachEvent("on" + type, registry.splice(index, 1)[0][3]);
			}
		}
	};

	WindowPrototype[dispatchEvent] = DocumentPrototype[dispatchEvent] = ElementPrototype[dispatchEvent] = function (eventObject) {
		return this.fireEvent("on" + eventObject.type, eventObject);
	};
})(window,Window.prototype, HTMLDocument.prototype, Element.prototype, "addEventListener", "removeEventListener", "dispatchEvent", []);
define("shim/addEventListener", function(){});

// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/forEach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fn, scope) {
        for(var i = 0, len = this.length; i < len; ++i) {
            fn.call(scope, this[i], i, this);
        }
    }
};
define("shim/Array.forEach", function(){});

if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if (i===undefined) i= 0;
        if (i<0) i+= this.length;
        if (i<0) i= 0;
        for (var n= this.length; i<n; i++)
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
};
define("shim/Array.indexOf", function(){});

// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/isArray
if(!Array.isArray) {
    Array.isArray = function (vArg) {
        return Object.prototype.toString.call(vArg) === "[object Array]";
    };
};
define("shim/Array.isArray", function(){});

// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                    ? this
                    : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
};
define("shim/Function.bind", function(){});

// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
};
define("shim/Object.create", function(){});

// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
    Object.keys = (function () {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function (obj) {
            if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

            var result = [];

            for (var prop in obj) {
                if (hasOwnProperty.call(obj, prop)) result.push(prop);
            }

            if (hasDontEnumBug) {
                for (var i=0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
                }
            }
            return result;
        }
    })()
};
define("shim/Object.keys", function(){});

(function (win, undefined) {

    

    var _uid = 1,
        // start at 1 because !uid returns false when uid===0
        _db = {};

    var util = {

        _setEntry: function (obj, prop) {

            var uid = obj.__pubSubUID;
            if (!uid) {
                uid = _uid++;
                obj.__pubSubUID = uid;
                _db[uid] = {
                    'obj': obj
                };
            }

            if (!_db[uid][prop]) {
                _db[uid][prop] = [];
            }

            return _db[uid];
        },

        _getEntryProp: function (obj, prop) {
            var entry = _db[obj.__pubSubUID];
            return entry ? _db[obj.__pubSubUID][prop] : null;
        },

        /**
         * Subscribe to an event
         * @memberof Observer
         * @param {Object} obj - Object to subscribe to
         * @param {String} type - Event type to listen for
         * @param {Function} fn - Function to call when event fires
         * @static
         */
        subscribe: function (obj, type, fn) {

            var entry = this._setEntry(obj, 'subscriptions');

            // check if already added
            var sub, i = 0,
                subs = entry.subscriptions,
                l = subs.length;
            for (; i < l; i++) {
                sub = subs[i];
                if (sub.type === type && sub.fn === fn) {
                    return;
                }
            }

            // add event
            subs.push({
                'type': type,
                'fn': fn
            });
        },

        /**
         * Unsubscribe from further notifications
         * @memberof Observer
         * @param {Object} obj - Object to unsubscribe from
         * @param {String} type - Event type to match
         * @param {Function} fn - Function to match
         * @static
         */
        unsubscribe: function (obj, type, fn) {

            var subs = this._getEntryProp(obj, 'subscriptions');
            if (!subs) {
                return;
            }

            // find and remove
            var sub, i = subs.length;
            while (--i >= 0) {
                sub = subs[i];
                if (sub.type === type && (sub.fn === fn || !fn)) {
                    subs.splice(i, 1);
                }
            }
        },

        /**
         * Publishes an event async
         * http://ejohn.org/blog/how-javascript-timers-work/
         * @param {Object} obj - Object to fire the event on
         * @param {String} type - Event type to fire
         * @param {Object} [data] - optional data carrier
         * @static
         */
        publishAsync: function (obj, type, data) {
            var self = this;
            setTimeout(function () {
                self.publish(obj, type, data);
            }, 0);
        },

        /**
         * Publish an event
         * @memberof Observer
         * @param {Object} obj - Object to fire the event on
         * @param {String} type - Event type to fire
         * @param {Object} [data] - optional data carrier
         * @static
         */
        publish: function (obj, type, data) {

            var entry = this._setEntry(obj, 'subscriptions');

            // find and execute callback
            var matches = [],
                i = 0,
                subs = entry.subscriptions,
                l = subs.length,
                receivers = entry.receivers,
                sub;
            for (; i < l; i++) {
                sub = subs[i];
                if (sub.type === type) {
                    matches.push(sub);
                }
            }

            // execute matched callbacks
            l = matches.length;
            for (i = 0; i < l; i++) {
                matches[i].fn(data);
            }

            // see if any receivers should be informed
            if (!receivers) {
                return;
            }

            l = receivers.length;
            for (i = 0; i < l; i++) {
                this.publish(receivers[i], type, data);
            }
        },

        /**
         * Setup propagation target for events so they can bubble up the object tree
         * @memberof Observer
         * @param {Object} informant - Object to set as origin
         * @param {Object} receiver - Object to set as target
         * @return {Boolean} if setup was successful
         * @static
         */
        inform: function (informant, receiver) {

            if (!informant || !receiver) {
                return false;
            }

            var entry = this._setEntry(informant, 'receivers');
            entry.receivers.push(receiver);

            return true;
        },

        /**
         * Remove propagation target
         * @memberof Observer
         * @param {Object} informant - Object set as origin
         * @param {Object} receiver - Object set as target
         * @return {Boolean} if removal was successful
         * @static
         */
        conceal: function (informant, receiver) {

            if (!informant || !receiver) {
                return false;
            }

            var receivers = this._getEntryProp(informant, 'receivers');
            if (!receivers) {
                return false;
            }

            // find and remove
            var i = receivers.length,
                item;
            while (--i >= 0) {
                item = receivers[i];
                if (item === receiver) {
                    receivers.splice(i, 1);
                    return true;
                }
            }

            return false;
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = util;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/utils/Observer',[],function () {
            return util;
        });
    }
    // Browser globals
    else {
        win.Observer = util;
    }

}(window));
(function (win, undefined) {

    

    // Promise
    // https://gist.github.com/rikschennink/11279384 (fork)
    var util = function Promise() {
        this._thens = [];
    };

    // jshint ignore:start
    util.prototype = {

        /* This is the "front end" API. */

        // then(onResolve, onReject): Code waiting for this promise uses the
        // then() method to be notified when the promise is complete. There
        // are two completion callbacks: onReject and onResolve. A more
        // robust promise implementation will also have an onProgress handler.
        then: function (onResolve, onReject) {
            // capture calls to then()
            this._thens.push({
                resolve: onResolve,
                reject: onReject
            });
        },

        // Some promise implementations also have a cancel() front end API that
        // calls all of the onReject() callbacks (aka a "cancelable promise").
        // cancel: function (reason) {},
        /* This is the "back end" API. */

        // resolve(resolvedValue): The resolve() method is called when a promise
        // is resolved (duh). The resolved value (if any) is passed by the resolver
        // to this method. All waiting onResolve callbacks are called
        // and any future ones are, too, each being passed the resolved value.
        resolve: function (val) {
            this._complete('resolve', val);
        },

        // reject(exception): The reject() method is called when a promise cannot
        // be resolved. Typically, you'd pass an exception as the single parameter,
        // but any other argument, including none at all, is acceptable.
        // All waiting and all future onReject callbacks are called when reject()
        // is called and are passed the exception parameter.
        reject: function (ex) {
            this._complete('reject', ex);
        },

        // Some promises may have a progress handler. The back end API to signal a
        // progress "event" has a single parameter. The contents of this parameter
        // could be just about anything and is specific to your implementation.
        // progress: function (data) {},
        /* "Private" methods. */

        _complete: function (which, arg) {
            // switch over to sync then()
            this.then = which === 'resolve' ?
            function (resolve, reject) {
                resolve(arg);
            } : function (resolve, reject) {
                reject(arg);
            };
            // disallow multiple calls to resolve or reject
            this.resolve = this.reject =

            function () {
                throw new Error('Promise already completed.');
            };
            // complete all waiting (async) then()s
            var aThen, i = 0;
            while (aThen = this._thens[i++]) {
                aThen[which] && aThen[which](arg);
            }
            delete this._thens;
        }

    };
    // jshint ignore:end
    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = util;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/utils/Promise',[],function () {
            return util;
        });
    }
    // Browser globals
    else {
        win.Promise = util;
    }

}(window));
(function (win, doc, undefined) {

    

    // define contains method based on browser capabilities
    var el = doc ? doc.body : null,
        util;
    if (el && el.compareDocumentPosition) {
        util = function (parent, child) { /* jshint -W016 */
            return !!(parent.compareDocumentPosition(child) & 16);
        };
    }
    else if (el && el.contains) {
        util = function (parent, child) {
            return parent != child && parent.contains(child);
        };
    }
    else {
        util = function (parent, child) {
            var node = child.parentNode;
            while (node) {
                if (node === parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        };
    }

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = util;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/utils/contains',[],function () {
            return util;
        });
    }
    // Browser globals
    else {
        win.contains = util;
    }

}(window, document));
(function (win, doc, undefined) {

    

    // define method used for matchesSelector
    var util = null,
        _method = null,
        el = doc ? doc.body : null;
    if (!el || el.matches) {
        _method = 'matches';
    }
    else if (el.webkitMatchesSelector) {
        _method = 'webkitMatchesSelector';
    }
    else if (el.mozMatchesSelector) {
        _method = 'mozMatchesSelector';
    }
    else if (el.msMatchesSelector) {
        _method = 'msMatchesSelector';
    }
    else if (el.oMatchesSelector) {
        _method = 'oMatchesSelector';
    }

    // if method found use native matchesSelector
    if (_method) {
        util = function (element, selector) {
            return element[_method](selector);
        };
    }
    else {

        // check if an element matches a CSS selector
        // https://gist.github.com/louisremi/2851541
        util = function (element, selector) {

            // We'll use querySelectorAll to find all element matching the selector,
            // then check if the given element is included in that list.
            // Executing the query on the parentNode reduces the resulting nodeList,
            // document doesn't have a parentNode, though.
            var nodeList = (element.parentNode || doc).querySelectorAll(selector) || [],
                i = nodeList.length;

            // loop through nodeList
            while (i--) {
                if (nodeList[i] == element) {
                    return true;
                }
            }
            return false;
        };

    }

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = util;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/utils/matchesSelector',[],function () {
            return util;
        });
    }
    // Browser globals
    else {
        win.matchesSelector = util;
    }

}(window, document));
(function (win, undefined) {

    

    var util = function (target, src) {

        var array = Array.isArray(src);
        var dst = array && [] || {};

        src = src || {};

        if (array) {
            // arrays are not merged
            dst = src.concat();
        }
        else {

            if (target && typeof target === 'object') {

                Object.keys(target).forEach(function (key) {
                    dst[key] = target[key];
                });

            }

            Object.keys(src).forEach(function (key) {

                if (typeof src[key] !== 'object' || !src[key]) {
                    dst[key] = src[key];
                }
                else {
                    if (!target[key]) {
                        dst[key] = src[key];
                    }
                    else {
                        dst[key] = util(target[key], src[key]);
                    }
                }

            });
        }

        return dst;
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = util;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/utils/mergeObjects',[],function () {
            return util;
        });
    }
    // Browser globals
    else {
        win.mergeObjects = util;
    }

}(window));
// conditioner v1.0.0 - ConditionerJS - Frizz free, environment-aware, javascript modules.
// Copyright (c) 2014 Rik Schennink - http://conditionerjs.com
// License: MIT - http://www.opensource.org/licenses/mit-license.php
(function (doc, undefined) {

    

    // returns conditioner API
    var factory = function (require, Observer, Promise, contains, matchesSelector, mergeObjects) {

        // private vars
        var _options, _monitorFactory, _moduleLoader;

        // internal modules
        /**
         * Test
         * @param {String} path to monitor
         * @param {String} expected value
         * @constructor
         */
        var Test = function Test(path, expected) {

            this._path = path;
            this._expected = expected;
            this._watches = [];
            this._count = 0;

        };

        Test.prototype = {

            /**
             * Returns a path to the required monitor
             * @returns {String}
             */
            getPath: function () {
                return this._path;
            },

            /**
             * Returns the expected value
             * @returns {String}
             */
            getExpected: function () {
                return this._expected;
            },

            /**
             * Returns true if none of the watches return a false state
             * @returns {Boolean}
             */
            isTrue: function () {
                var i = 0,
                    l = this._count;
                for (; i < l; i++) {
                    if (!this._watches[i].valid) {
                        return false;
                    }
                }
                return true;
            },

            /**
             * Assigns a new watch for this test
             * @param watches
             */
            assignWatches: function (watches) {
                this._watches = watches;
                this._count = watches.length;
            },

            /**
             * Returns test in path
             * @returns {String}
             */
            toString: function () {
                return this._path + ':{' + this._expected + '}';
            }

        };
        var Condition = function (expression, callback) {

            // get expression
            this._expression = expression;

            // on detect change callback
            this._change = callback;

            // default state is limbo
            this._currentState = null;

        };

        Condition.prototype = {

            /**
             * Evaluate expression, call change method if there's a diff with the last evaluation
             */
            evaluate: function () {
                var state = this._expression.isTrue();
                if (state != this._currentState) {
                    this._currentState = state;
                    this._change(state);
                }
            }

        };
        var MonitorFactory = function () {
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
            _parse: function (expression, isSingleTest) {

                // if earlier parse action found return that one
                if (this._expressions[expression]) {
                    return this._expressions[expression];
                }

                // parse expression
                var i = 0,
                    expressions = expression.split(','),
                    l = expressions.length,
                    result = [],
                    parts;
                for (; i < l; i++) {
                    parts = expressions[i].split(':');
                    result.push({

                        // test name
                        test: parts[0],

                        // expected custom value or expect true by default
                        value: isSingleTest ? parts[0] : typeof parts[1] === 'undefined' ? true : parts[1]

                    });
                }

                // remember the resulting array
                this._expressions[expression] = result;
                return result;
            },

            _mergeData: function (base, expected, element) {
                return mergeObjects({
                    element: element,
                    expected: expected
                }, base);
            },

            /**
             * Create a new Monitor based on passed configuration
             * @param {Test} test
             * @param {Element} element
             * @returns {Promise}
             */
            create: function (test, element) {

                // setup promise
                var p = new Promise();

                // path to monitor
                var path = test.getPath();

                // expected value
                var expected = test.getExpected();

                // load monitor configuration
                var self = this;
                _options.loader.require([_options.paths.monitors + path], function (setup) {

                    var i = 0,
                        monitor = self._monitors[path],
                        l, watch, watches, items, event, item, data, isSingleTest;

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

                        // data holder
                        data = setup.unique ? self._mergeData(setup.data, expected, element) : setup.data;

                        // setup trigger events manually
                        if (typeof setup.trigger === 'function') {
                            setup.trigger(monitor.change, data);
                        }

                        // auto bind trigger events
                        else {
                            for (event in setup.trigger) {
                                if (!setup.trigger.hasOwnProperty(event)) {
                                    continue;
                                }
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
                    items = setup.parse ? setup.parse(expected, isSingleTest) : self._parse(expected, isSingleTest);

                    // cache the amount of items
                    l = items.length;

                    for (; i < l; i++) {

                        item = items[i];

                        watch = {

                            // default limbo state before we've done any tests
                            valid: null,

                            // setup data holder for this watcher
                            data: setup.unique ? data : self._mergeData(setup.data, item.value, element),

                            // setup test method to use
                            // jshint -W083
                            test: (function (fn) {
                                if (!fn) {
                                    throw new Error('Conditioner: Test "' + item.test + '" not found on "' + path + '" Monitor.');
                                }
                                return function () {
                                    var state = fn(this.data);
                                    if (this.valid != state) {
                                        this.valid = state;
                                        Observer.publish(this, 'change');
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
        var WebContext = {

            test: function (query, element, change) {

                var expression, condition, i, tests, l;

                // convert query to expression
                expression = ExpressionParser.parse(query);

                // condition to evaluate on detect changes
                condition = new Condition(expression, change);

                // get found test setups from expression and register
                i = 0;
                tests = expression.getTests();
                l = tests.length;
                for (; i < l; i++) {
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

            _setupMonitor: function (test, element, condition) {

                var i = 0,
                    l;
                _monitorFactory.create(test, element).then(function (watches) {

                    // multiple watches
                    test.assignWatches(watches);

                    // add value watches
                    l = watches.length;
                    for (; i < l; i++) {

                        // listen to change event on the watchers
                        // jshint -W083
                        Observer.subscribe(watches[i], 'change', function () {
                            condition.evaluate();
                        });

                    }

                    // do initial evaluation
                    condition.evaluate();

                });

            }

        };
        /**
         * @class
         * @constructor
         * @param {UnaryExpression|BinaryExpression|Test} expression
         * @param {Boolean} negate
         */
        var UnaryExpression = function (expression, negate) {

            this._expression = expression;
            this._negate = typeof negate === 'undefined' ? false : negate;

        };

        /**
         * Tests if valid expression
         * @returns {Boolean}
         */
        UnaryExpression.prototype.isTrue = function () {
            return this._expression.isTrue() !== this._negate;
        };

        /**
         * Returns tests contained in this expression
         * @returns Array
         */
        UnaryExpression.prototype.getTests = function () {
            return this._expression instanceof Test ? [this._expression] : this._expression.getTests();
        };

        /**
         * Cast to string
         * @returns {string}
         */
        UnaryExpression.prototype.toString = function () {
            return (this._negate ? 'not ' : '') + this._expression.toString();
        };
        /**
         * @class
         * @constructor
         * @param {UnaryExpression} a
         * @param {String} operator
         * @param {UnaryExpression} b
         */
        var BinaryExpression = function (a, operator, b) {

            this._a = a;
            this._operator = operator;
            this._b = b;

        };

        /**
         * Tests if valid expression
         * @returns {Boolean}
         */
        BinaryExpression.prototype.isTrue = function () {

            return this._operator === 'and' ?

            // is 'and' operator
            this._a.isTrue() && this._b.isTrue() :

            // is 'or' operator
            this._a.isTrue() || this._b.isTrue();

        };

        /**
         * Returns tests contained in this expression
         * @returns Array
         */
        BinaryExpression.prototype.getTests = function () {
            return this._a.getTests().concat(this._b.getTests());
        };

        /**
         * Outputs the expression as a string
         * @returns {String}
         */
        BinaryExpression.prototype.toString = function () {
            return '(' + this._a.toString() + ' ' + this._operator + ' ' + this._b.toString() + ')';
        };
        var ExpressionParser = {

            /**
             * Parses an expression in string format and returns the same expression formatted as an expression tree
             * @memberof ExpressionFormatter
             * @param {String} expression
             * @returns {UnaryExpression|BinaryExpression}
             * @public
             */
            parse: function (expression) {

                var i = 0,
                    path = '',
                    tree = [],
                    value = '',
                    negate = false,
                    isValue = false,
                    target = null,
                    parent = null,
                    parents = [],
                    l = expression.length,
                    lastIndex, index, operator, test, j, c, k, n, op, ol, tl;

                if (!target) {
                    target = tree;
                }

                // read explicit expressions
                for (; i < l; i++) {

                    c = expression.charCodeAt(i);

                    // check if an expression, test for '{'
                    if (c === 123) {

                        // now reading the expression
                        isValue = true;

                        // reset path var
                        path = '';

                        // fetch path
                        k = i - 2;
                        while (k >= 0) {
                            n = expression.charCodeAt(k);

                            // test for ' ' or '('
                            if (n === 32 || n === 40) {
                                break;
                            }
                            path = expression.charAt(k) + path;
                            k--;
                        }

                        // on to the next character
                        continue;

                    }

                    // else if is '}'
                    else if (c === 125) {

                        lastIndex = target.length - 1;
                        index = lastIndex + 1;

                        // negate if last index contains not operator
                        negate = target[lastIndex] === 'not';

                        // if negate overwrite not operator location in array
                        index = negate ? lastIndex : lastIndex + 1;

                        // setup test
                        test = new Test(path, value);

                        // add expression
                        target[index] = new UnaryExpression(
                        test, negate);

                        // reset vars
                        path = '';
                        value = '';

                        negate = false;

                        // no longer a value
                        isValue = false;
                    }

                    // if we are reading an expression add characters to expression
                    if (isValue) {
                        value += expression.charAt(i);
                        continue;
                    }

                    // if not in expression
                    // check if goes up a level, test for '('
                    if (c === 40) {

                        // create new empty array in target
                        target.push([]);

                        // remember current target (is parent)
                        parents.push(target);

                        // set new child slot as new target
                        target = target[target.length - 1];

                    }

                    // find out if next set of characters is a logical operator. Testing for ' ' or '('
                    if (c === 32 || i === 0 || c === 40) {

                        operator = expression.substr(i, 5).match(/and |or |not /g);
                        if (!operator) {
                            continue;
                        }

                        // get reference and calculate length
                        op = operator[0];
                        ol = op.length - 1;

                        // add operator
                        target.push(op.substring(0, ol));

                        // skip over operator
                        i += ol;
                    }

                    // expression or level finished, time to clean up. Testing for ')'
                    if (c === 41 || i === l - 1) {

                        do {

                            // get parent reference
                            parent = parents.pop();

                            // if contains zero elements = ()
                            if (target.length === 0) {

                                // zero elements added revert to parent
                                target = parent;

                                continue;
                            }

                            // if more elements start the grouping process
                            j = 0;
                            tl = target.length;

                            for (; j < tl; j++) {

                                if (typeof target[j] !== 'string') {
                                    continue;
                                }

                                // handle not expressions first
                                if (target[j] === 'not') {
                                    target.splice(j, 2, new UnaryExpression(target[j + 1], true));

                                    // rewind
                                    j = -1;
                                    tl = target.length;
                                }
                                // handle binary expression
                                else if (target[j + 1] !== 'not') {
                                    target.splice(j - 1, 3, new BinaryExpression(target[j - 1], target[j], target[j + 1]));

                                    // rewind
                                    j = -1;
                                    tl = target.length;
                                }

                            }

                            // if contains only one element
                            if (target.length === 1 && parent) {

                                // overwrite target index with target content
                                parent[parent.length - 1] = target[0];

                                // set target to parent array
                                target = parent;

                            }

                        }
                        while (i === l - 1 && parent);

                    }
                    // end of ')' character or last index
                }

                // return final expression tree
                //return {
                return tree.length === 1 ? tree[0] : tree;
                //     tests:test
                //};
            }

        };
        /**
         * Static Module Agent, will always load the module
         * @type {Object}
         */
        var StaticModuleAgent = {

            /**
             * Initialize, resolved immediately
             * @returns {Promise}
             */
            init: function (ready) {
                ready();
            },

            /**
             * Is activation currently allowed, will always return true for static module agent
             * @returns {boolean}
             */
            allowsActivation: function () {
                return true;
            },

            /**
             * Clean up
             * As we have not attached any event listeners there's nothing to clean
             */
            destroy: function () {
                // nothing to clean up
            }
        };
        var ConditionModuleAgent = function (conditions, element) {

            // if no conditions, conditions will always be suitable
            if (typeof conditions !== 'string' || !conditions.length) {
                return;
            }

            this._conditions = conditions;
            this._element = element;
            this._state = false;

        };

        ConditionModuleAgent.prototype = {

            /**
             * Initialize, resolve on first test results
             * @returns {Promise}
             */
            init: function (ready) {

                var self = this,
                    init = false;
                WebContext.test(this._conditions, this._element, function (valid) {

                    // something changed
                    self._state = valid;

                    // notify others of this state change
                    Observer.publish(self, 'change');

                    // call ready
                    if (!init) {
                        init = true;
                        ready();
                    }

                });

            },

            /**
             * Returns true if the current conditions allow module activation
             * @return {Boolean}
             * @public
             */
            allowsActivation: function () {
                return this._state;
            },

            /**
             * Cleans up event listeners and readies object for removal
             */
            destroy: function () {

                // destroy
            }

        };
        var ModuleRegistry = {

            _options: {},
            _redirects: {},

            /**
             * Register a module
             * @param {String} path - path to module
             * @param {Object} options - configuration to setup for module
             * @param {String} alias - alias name for module
             * @static
             */
            registerModule: function (path, options, alias) {

                // remember options for absolute path
                this._options[_options.loader.toUrl(path)] = options;

                // setup redirect from alias
                if (alias) {
                    this._redirects[alias] = path;
                }

                // pass configuration to loader
                _options.loader.config(path, options);
            },

            /**
             * Returns the actual path if the path turns out to be a redirect
             * @param path
             * @returns {*}
             */
            getRedirect: function (path) {
                return this._redirects[path] || path;
            },

            /**
             * Get a registered module by path
             * @param {String} path - path to module
             * @return {Object} - module specification object
             * @static
             */
            getModule: function (path) {

                // if no id supplied throw error
                if (!path) {
                    throw new Error('ModuleRegistry.getModule(path): "path" is a required parameter.');
                }

                return this._options[path] || this._options[_options.loader.toUrl(path)];

            }

        };
        /**
         * @exports ModuleController
         * @class
         * @constructor
         * @param {String} path - reference to module
         * @param {Element} element - reference to element
         * @param {Object|null} [options] - options for this ModuleController
         * @param {Object} [agent] - module activation agent
         */
        var ModuleController = function (path, element, options, agent) {

            // if no path supplied, throw error
            if (!path || !element) {
                throw new Error('ModuleController(path,element,options,agent): "path" and "element" are required parameters.');
            }

            // path to module
            this._path = ModuleRegistry.getRedirect(path);
            this._alias = path;

            // reference to element
            this._element = element;

            // options for module controller
            this._options = options || {};

            // set loader
            this._agent = agent || StaticModuleAgent;

            // module definition reference
            this._Module = null;

            // module instance reference
            this._module = null;

            // default init state
            this._initialized = false;

            // agent binds
            this._onAgentStateChangeBind = this._onAgentStateChange.bind(this);

            // wait for init to complete
            var self = this;
            this._agent.init(function () {
                self._initialize();
            });

        };

        ModuleController.prototype = {

            /**
             * returns true if the module controller has initialized
             * @returns {Boolean}
             */
            hasInitialized: function () {
                return this._initialized;
            },

            /**
             * Returns the module path
             * @returns {String}
             * @public
             */
            getModulePath: function () {
                return this._path;
            },

            /**
             * Returns true if the module is currently waiting for load
             * @returns {Boolean}
             * @public
             */
            isModuleAvailable: function () {
                return this._agent.allowsActivation() && !this._module;
            },

            /**
             * Returns true if module is currently active and loaded
             * @returns {Boolean}
             * @public
             */
            isModuleActive: function () {
                return this._module !== null;
            },

            /**
             * Checks if it wraps a module with the supplied path
             * @param {String} path - path of module to test for
             * @return {Boolean}
             * @public
             */
            wrapsModuleWithPath: function (path) {
                return this._path === path || this._alias === path;
            },

            /**
             * Called to initialize the module
             * @private
             * @fires init
             */
            _initialize: function () {

                // now in initialized state
                this._initialized = true;

                // listen to behavior changes
                Observer.subscribe(this._agent, 'change', this._onAgentStateChangeBind);

                // let others know we have initialized
                Observer.publishAsync(this, 'init', this);

                // if activation is allowed, we are directly available
                if (this._agent.allowsActivation()) {
                    this._onBecameAvailable();
                }

            },

            /**
             * Called when the module became available, this is when it's suitable for load
             * @private
             * @fires available
             */
            _onBecameAvailable: function () {

                // we are now available
                Observer.publishAsync(this, 'available', this);

                // let's load the module
                this._load();

            },

            /**
             * Called when the agent state changes
             * @private
             */
            _onAgentStateChange: function () {

                // check if module is available
                var shouldLoadModule = this._agent.allowsActivation();

                // determine what action to take basted on availability of module
                if (this._module && !shouldLoadModule) {
                    this._unload();
                }
                else if (!this._module && shouldLoadModule) {
                    this._onBecameAvailable();
                }

            },

            /**
             * Load the module contained in this ModuleController
             * @public
             */
            _load: function () {

                // if module available no need to require it
                if (this._Module) {
                    this._onLoad();
                    return;
                }

                // load module, and remember reference
                var self = this;
                _options.loader.require([this._path], function (Module) {

                    // if module does not export a module quit here
                    if (!Module) {
                        throw new Error('ModuleController: A module needs to export an object.');
                    }

                    // set reference to Module
                    self._Module = Module;

                    // module is now ready to be loaded
                    self._onLoad();

                });

            },

            /**
             * Turns possible options string into options object
             * @param {String|Object} options
             * @returns {Object}
             * @private
             */
            _optionsToObject: function (options) {
                if (typeof options === 'string') {
                    try {
                        return JSON.parse(options);
                    }
                    catch (e) {
                        throw new Error('ModuleController.load(): "options" is not a valid JSON string.');
                    }
                }
                return options;
            },

            /**
             * Parses options for given url and module also
             * @param {String} url - url to module
             * @param {Object} Module - Module definition
             * @param {Object|String} overrides - page level options to override default options with
             * @returns {Object}
             * @private
             */
            _parseOptions: function (url, Module, overrides) {

                var stack = [],
                    pageOptions = {},
                    moduleOptions = {},
                    options, i;
                do {

                    // get settings
                    options = ModuleRegistry.getModule(url);

                    // stack the options
                    stack.push({
                        'page': options,
                        'module': Module.options
                    });

                    // fetch super path
                    url = Module.__superUrl;

                    // jshint -W084
                } while (Module = Module.__super);

                // reverse loop over stack and merge options
                i = stack.length;
                while (i--) {
                    pageOptions = mergeObjects(pageOptions, stack[i].page);
                    moduleOptions = mergeObjects(moduleOptions, stack[i].module);
                }

                // merge page and module options
                options = mergeObjects(moduleOptions, pageOptions);

                // apply overrides
                if (overrides) {
                    options = mergeObjects(options, this._optionsToObject(overrides));
                }

                return options;
            },

            /**
             * Method called when module loaded
             * @fires load
             * @private
             */
            _onLoad: function () {

                // if activation is no longer allowed, stop here
                if (!this._agent.allowsActivation()) {
                    return;
                }

                // parse and merge options for this module
                var options = this._parseOptions(this._path, this._Module, this._options);

                // set reference
                if (typeof this._Module === 'function') {

                    // is of function type so try to create instance
                    this._module = new this._Module(this._element, options);
                }
                else {

                    // is of other type so expect load method to be defined
                    this._module = this._Module.load ? this._Module.load(this._element, options) : null;

                    // if module not defined we could be dealing with a static class
                    if (typeof this._module === 'undefined') {
                        this._module = this._Module;
                    }
                }

                // if no module defined throw error
                if (!this._module) {
                    throw new Error('ModuleController.load(): could not initialize module, missing constructor or "load" method.');
                }

                // watch for events on target
                // this way it is possible to listen to events on the controller which is always there
                Observer.inform(this._module, this);

                // publish load event
                Observer.publishAsync(this, 'load', this);
            },


            /**
             * Unloads the wrapped module
             * @fires unload
             * @return {Boolean}
             */
            _unload: function () {

                // module is now no longer ready to be loaded
                this._available = false;

                // if no module, module has already been unloaded or was never loaded
                if (!this._module) {
                    return false;
                }

                // stop watching target
                Observer.conceal(this._module, this);

                // unload module if possible
                if (this._module.unload) {
                    this._module.unload();
                }

                // reset property
                this._module = null;

                // publish unload event
                Observer.publishAsync(this, 'unload', this);

                return true;
            },

            /**
             * Cleans up the module and module controller and all bound events
             * @public
             */
            destroy: function () {

                // unload module
                this._unload();

                // unbind events
                Observer.unsubscribe(this._agent, 'ready', this._onAgentReadyBind);
                Observer.unsubscribe(this._agent, 'change', this._onAgentStateChangeBind);

                // call destroy on agent
                this._agent.destroy();

            },

            /**
             * Executes a methods on the wrapped module
             * @param {String} method - method key
             * @param {Array} [params] - optional array containing the method parameters
             * @return {Object} containing response of executed method and a status code
             * @public
             */
            execute: function (method, params) {

                // if module not loaded
                if (!this._module) {
                    return {
                        'status': 404,
                        'response': null
                    };
                }

                // get function reference
                var F = this._module[method];
                if (!F) {
                    throw new Error('ModuleController.execute(method,params): function specified in "method" not found on module.');
                }

                // if no params supplied set to empty array,
                // ie8 falls on it's knees when it gets an undefined parameter object in the apply method
                params = params || [];

                // once loaded call method and pass parameters
                return {
                    'status': 200,
                    'response': F.apply(this._module, params)
                };

            }

        };
        var NodeController = (function () {

            var _filterIsActiveModule = function (item) {
                return item.isModuleActive();
            };
            var _filterIsAvailableModule = function (item) {
                return item.isModuleAvailable();
            };
            var _mapModuleToPath = function (item) {
                return item.getModulePath();
            };

            /**
             * @class
             * @constructor
             * @param {Object} element
             * @param {Number} priority
             */
            var exports = function NodeController(element, priority) {

                if (!element) {
                    throw new Error('NodeController(element): "element" is a required parameter.');
                }

                // set element reference
                this._element = element;

                // has been processed
                this._element.setAttribute(_options.attr.processed, 'true');

                // set priority
                this._priority = !priority ? 0 : parseInt(priority, 10);

                // contains references to all module controllers
                this._moduleControllers = [];

                // binds
                this._moduleAvailableBind = this._onModuleAvailable.bind(this);
                this._moduleLoadBind = this._onModuleLoad.bind(this);
                this._moduleUnloadBind = this._onModuleUnload.bind(this);

            };

            /**
             * Static method testing if the current element has been processed already
             * @param {Element} element
             * @static
             */
            exports.hasProcessed = function (element) {
                return element.getAttribute(_options.attr.processed) === 'true';
            };

            exports.prototype = {

                /**
                 * Loads the passed module controllers to the node
                 * @param {...} arguments
                 * @public
                 */
                load: function () {

                    // if no module controllers found
                    if (!arguments || !arguments.length) {
                        throw new Error('NodeController.load(controllers): Expects an array of module controllers as parameters.');
                    }

                    // turn into array
                    this._moduleControllers = Array.prototype.slice.call(arguments, 0);

                    // listen to load events on module controllers
                    var i = 0,
                        l = this._moduleControllers.length,
                        mc;
                    for (; i < l; i++) {
                        mc = this._moduleControllers[i];
                        Observer.subscribe(mc, 'available', this._moduleAvailableBind);
                        Observer.subscribe(mc, 'load', this._moduleLoadBind);
                    }

                },

                /**
                 * Unload all attached modules and restore node in original state
                 * @public
                 */
                destroy: function () {

                    var i = 0,
                        l = this._moduleControllers.length;
                    for (; i < l; i++) {
                        this._destroyModule(this._moduleControllers[i]);
                    }

                    // reset array
                    this._moduleControllers = [];

                    // update initialized state
                    this._updateAttribute(_options.attr.initialized, this._moduleControllers);

                    // reset processed state
                    this._element.removeAttribute(_options.attr.processed);

                    // clear reference
                    this._element = null;
                },

                /**
                 * Call destroy method on module controller and clean up listeners
                 * @param moduleController
                 * @private
                 */
                _destroyModule: function (moduleController) {

                    // unsubscribe from module events
                    Observer.unsubscribe(moduleController, 'available', this._moduleAvailableBind);
                    Observer.unsubscribe(moduleController, 'load', this._moduleLoadBind);
                    Observer.unsubscribe(moduleController, 'unload', this._moduleUnloadBind);

                    // conceal events from module controller
                    Observer.conceal(moduleController, this);

                    // unload the controller
                    moduleController.destroy();

                },

                /**
                 * Returns the set priority for this node
                 * @public
                 */
                getPriority: function () {
                    return this._priority;
                },

                /**
                 * Returns the element linked to this node
                 * @public
                 */
                getElement: function () {
                    return this._element;
                },

                /**
                 * Public method to check if the module matches the given query
                 * @param {String} selector - CSS selector to match module to
                 * @param {Document|Element} [context] - Context to search in
                 * @return {Boolean}
                 * @public
                 */
                matchesSelector: function (selector, context) {
                    if (context && !contains(context, this._element)) {
                        return false;
                    }
                    return matchesSelector(this._element, selector, context);
                },

                /**
                 * Returns true if all module controllers are active
                 * @public
                 */
                areAllModulesActive: function () {
                    return this.getActiveModules().length === this._moduleControllers.length;
                },

                /**
                 * Returns an array containing all active module controllers
                 * @return {Array}
                 * @public
                 */
                getActiveModules: function () {
                    return this._moduleControllers.filter(_filterIsActiveModule);
                },

                /**
                 * Returns the first ModuleController matching the given path
                 * @param {String} [path] - module id
                 * @return {ModuleController|null}
                 * @public
                 */
                getModule: function (path) {
                    return this._getModules(path, true);
                },

                /**
                 * Returns an array of ModuleControllers matching the given path
                 * @param {String} [path] to module
                 * @return {Array}
                 * @public
                 */
                getModules: function (path) {
                    return this._getModules(path);
                },

                /**
                 * Returns one or multiple ModuleControllers matching the supplied path
                 * @param {String} [path] - Optional path to match the nodes to
                 * @param {Boolean} [singleResult] - Optional boolean to only ask for one result
                 * @returns {Array|ModuleController|null}
                 * @private
                 */
                _getModules: function (path, singleResult) {

                    // if no path supplied return all module controllers (or one if single result mode)
                    if (typeof path === 'undefined') {
                        if (singleResult) {
                            return this._moduleControllers[0];
                        }
                        return this._moduleControllers.concat();
                    }

                    // loop over module controllers matching the path, if single result is enabled, return on first hit, else collect
                    var i = 0,
                        l = this._moduleControllers.length,
                        results = [],
                        mc;
                    for (; i < l; i++) {
                        mc = this._moduleControllers[i];
                        if (!mc.wrapsModuleWithPath(path)) {
                            continue;
                        }
                        if (singleResult) {
                            return mc;
                        }
                        results.push(mc);
                    }
                    return singleResult ? null : results;
                },

                /**
                 * Public method for safely attempting method execution on modules
                 * @param {String} method - method key
                 * @param {Array} [params] - array containing the method parameters
                 * @return [Array] returns object containing status code and possible response data
                 * @public
                 */
                execute: function (method, params) {
                    return this._moduleControllers.map(function (item) {
                        return {
                            controller: item,
                            result: item.execute(method, params)
                        };
                    });
                },

                /**
                 * Called when a module becomes available for load
                 * @param moduleController
                 * @private
                 */
                _onModuleAvailable: function (moduleController) {

                    // propagate events from the module controller to the node so people can subscribe to events on the node
                    Observer.inform(moduleController, this);

                    // update loading attribute with currently loading module controllers list
                    this._updateAttribute(_options.attr.loading, this._moduleControllers.filter(_filterIsAvailableModule));
                },

                /**
                 * Called when module has loaded
                 * @param moduleController
                 * @private
                 */
                _onModuleLoad: function (moduleController) {

                    // listen to unload event
                    Observer.unsubscribe(moduleController, 'load', this._moduleLoadBind);
                    Observer.subscribe(moduleController, 'unload', this._moduleUnloadBind);

                    // update loading attribute with currently loading module controllers list
                    this._updateAttribute(_options.attr.loading, this._moduleControllers.filter(_filterIsAvailableModule));

                    // update initialized attribute with currently active module controllers list
                    this._updateAttribute(_options.attr.initialized, this.getActiveModules());
                },

                /**
                 * Called when module has unloaded
                 * @param moduleController
                 * @private
                 */
                _onModuleUnload: function (moduleController) {

                    // stop listening to unload
                    Observer.subscribe(moduleController, 'load', this._moduleLoadBind);
                    Observer.unsubscribe(moduleController, 'unload', this._moduleUnloadBind);

                    // conceal events from module controller
                    Observer.conceal(moduleController, this);

                    // update initialized attribute with now active module controllers list
                    this._updateAttribute(_options.attr.initialized, this.getActiveModules());
                },

                /**
                 * Updates the given attribute with paths of the supplied controllers
                 * @private
                 */
                _updateAttribute: function (attr, controllers) {
                    var modules = controllers.map(_mapModuleToPath);
                    if (modules.length) {
                        this._element.setAttribute(attr, modules.join(','));
                    }
                    else {
                        this._element.removeAttribute(attr);
                    }
                }

            };

            return exports;

        }());
        /**
         * Creates a controller group to sync controllers
         * @constructor
         */
        var SyncedControllerGroup = function () {

            // if no node controllers passed, no go
            if (!arguments || !arguments.length) {
                throw new Error('SyncedControllerGroup(controllers): Expects an array of node controllers as parameters.');
            }

            // by default modules are expected to not be in sync
            this._inSync = false;

            // turn arguments into an array
            this._controllers = arguments.length === 1 ? arguments[0] : Array.prototype.slice.call(arguments, 0);
            this._controllerLoadedBind = this._onLoad.bind(this);
            this._controllerUnloadedBind = this._onUnload.bind(this);

            var i = 0,
                controller, l = this._controllers.length;
            for (; i < l; i++) {
                controller = this._controllers[i];

                // if controller is undefined
                if (!controller) {
                    throw new Error('SyncedControllerGroup(controllers): Stumbled upon an undefined controller is undefined.');
                }

                // listen to load and unload events so we can pass them on if appropriate
                Observer.subscribe(controller, 'load', this._controllerLoadedBind);
                Observer.subscribe(controller, 'unload', this._controllerUnloadedBind);
            }

            // test now to see if modules might already be in sync
            this._test();
        };

        SyncedControllerGroup.prototype = {

            /**
             * Destroy sync group, stops listening and cleans up
             */
            destroy: function () {

                // unsubscribe
                var i = 0,
                    controller, l = this._controllers.length;
                for (; i < l; i++) {
                    controller = this._controllers[i];

                    // listen to load and unload events so we can pass them on if appropriate
                    Observer.unsubscribe(controller, 'load', this._controllerLoadedBind);
                    Observer.unsubscribe(controller, 'unload', this._controllerUnloadedBind);
                }

                // reset array
                this._controllers = [];

            },

            /**
             * Returns true if all modules have loaded
             * @returns {Boolean}
             */
            areAllModulesActive: function () {
                var i = 0,
                    l = this._controllers.length,
                    controller;
                for (; i < l; i++) {
                    controller = this._controllers[i];
                    if (!this._isActiveController(controller)) {
                        return false;
                    }
                }
                return true;
            },

            /**
             * Called when a module loads
             * @private
             */
            _onLoad: function () {
                this._test();
            },

            /**
             * Called when a module unloads
             * @private
             */
            _onUnload: function () {
                this._unload();
            },

            /**
             * Tests if the node or module controller has loaded their modules
             * @param controller
             * @returns {Boolean}
             * @private
             */
            _isActiveController: function (controller) {
                return ((controller.isModuleActive && controller.isModuleActive()) || (controller.areAllModulesActive && controller.areAllModulesActive()));
            },

            /**
             * Tests if all controllers have loaded, if so calls the _load method
             * @private
             */
            _test: function () {

                // loop over modules testing their active state, if one is inactive we stop immediately
                if (!this.areAllModulesActive()) {
                    return;
                }

                // if all modules loaded fire load event
                this._load();

            },

            /**
             * Fires a load event when all controllers have indicated they have loaded and we have not loaded yet
             * @fires load
             * @private
             */
            _load: function () {
                if (this._inSync) {
                    return;
                }
                this._inSync = true;
                Observer.publishAsync(this, 'load', this._controllers);
            },

            /**
             * Fires an unload event once we are in loaded state and one of the controllers unloads
             * @fires unload
             * @private
             */
            _unload: function () {
                if (!this._inSync) {
                    return;
                }
                this._inSync = false;
                Observer.publish(this, 'unload', this._controllers);
            }

        };
        /**
         * @exports ModuleLoader
         * @class
         * @constructor
         */
        var ModuleLoader = function () {

            // array of all parsed nodes
            this._nodes = [];

        };

        ModuleLoader.prototype = {

            /**
             * Loads all modules within the supplied dom tree
             * @param {Document|Element} context - Context to find modules in
             * @return {Array} - Array of found Nodes
             */
            parse: function (context) {

                // if no context supplied, throw error
                if (!context) {
                    throw new Error('ModuleLoader.loadModules(context): "context" is a required parameter.');
                }

                // register vars and get elements
                var elements = context.querySelectorAll('[data-module]'),
                    l = elements.length,
                    i = 0,
                    nodes = [],
                    node, element;

                // if no elements do nothing
                if (!elements) {
                    return [];
                }

                // process elements
                for (; i < l; i++) {

                    // set element reference
                    element = elements[i];

                    // test if already processed
                    if (NodeController.hasProcessed(element)) {
                        continue;
                    }

                    // create new node
                    nodes.push(new NodeController(element, element.getAttribute(_options.attr.priority)));
                }

                // sort nodes by priority:
                // higher numbers go first,
                // then 0 (a.k.a. no priority assigned),
                // then negative numbers
                // note: it's actually the other way around but that's because of the reversed while loop coming next
                nodes.sort(function (a, b) {
                    return a.getPriority() - b.getPriority();
                });

                // initialize modules depending on assigned priority (in reverse, but priority is reversed as well so all is okay)
                i = nodes.length;
                while (--i >= 0) {
                    node = nodes[i];
                    node.load.apply(node, this._getModuleControllersByElement(node.getElement()));
                }

                // merge new nodes with currently active nodes list
                this._nodes = this._nodes.concat(nodes);

                // returns nodes so it is possible to later unload nodes manually if necessary
                return nodes;
            },

            /**
             * Setup the given element with the passed module controller(s)
             * @param {Element} element - Element to bind the controllers to
             * @param {Array|ModuleController} controllers - module controller configurations
             * [
             *     {
             *         path: 'path/to/module',
             *         conditions: 'config',
             *         options: {
             *             foo: 'bar'
             *         }
             *     }
             * ]
             * @return {NodeController|null} - The newly created node or null if something went wrong
             */
            load: function (element, controllers) {

                if (!controllers) {
                    return null;
                }

                // if controllers is object put in array
                controllers = controllers.length ? controllers : [controllers];

                // vars
                var node, i = 0,
                    l = controllers.length,
                    moduleControllers = [],
                    controller;

                // create node
                node = new NodeController(element);

                // create controllers
                for (; i < l; i++) {
                    controller = controllers[i];
                    moduleControllers.push(
                    this._getModuleController(controller.path, element, controller.options, controller.conditions));
                }

                // create initialize
                node.load(moduleControllers);

                // remember so can later be retrieved through getNode methodes
                this._nodes.push(node);

                // return the loaded Node
                return node;
            },

            /**
             * Returns one or multiple nodes matching the selector
             * @param {String} [selector] - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @param {Boolean} [singleResult] - Optional boolean to only ask one result
             * @returns {Array|Node|null}
             * @public
             */
            getNodes: function (selector, context, singleResult) {

                // if no query supplied return all nodes
                if (typeof selector === 'undefined' && typeof context === 'undefined') {
                    if (singleResult) {
                        return this._nodes[0];
                    }
                    return this._nodes.concat();
                }

                // find matches (done by querying the node for a match)
                var i = 0,
                    l = this._nodes.length,
                    results = [],
                    node;
                for (; i < l; i++) {
                    node = this._nodes[i];
                    if (node.matchesSelector(selector, context)) {
                        if (singleResult) {
                            return node;
                        }
                        results.push(node);
                    }
                }

                return singleResult ? null : results;
            },

            /**
             * Destroy the passed node reference
             * @param {Array} nodes
             * @return {Boolean}
             * @public
             */
            destroy: function (nodes) {

                var i = nodes.length,
                    destroyed = 0,
                    hit;

                while (i--) {

                    hit = this._nodes.indexOf(nodes[i]);
                    if (hit === -1) {
                        continue;
                    }

                    this._nodes.splice(hit, 1);
                    nodes[i].destroy();
                    destroyed++;

                }

                return nodes.length === destroyed;
            },

            /**
             * Parses module controller configuration on element and returns array of module controllers
             * @param {Element} element
             * @returns {Array}
             * @private
             */
            _getModuleControllersByElement: function (element) {

                var controllers = [],
                    config = element.getAttribute(_options.attr.module) || '',
                    i = 0,
                    specs, spec, l;

                // test if first character is a '[', if so multiple modules have been defined
                if (config.charCodeAt(0) === 91) {

                    // add multiple module adapters
                    try {
                        specs = JSON.parse(config);
                    }
                    catch (e) {
                        throw new Error('ModuleLoader.load(context): "data-module" attribute contains a malformed JSON string.');
                    }

                    // no specification found or specification parsing failed
                    if (!specs) {
                        return [];
                    }

                    // setup vars
                    l = specs.length;

                    // test if second character is a '{' if so, json format
                    if (config.charCodeAt(1) === 123) {
                        for (; i < l; i++) {
                            spec = specs[i];
                            controllers.push(
                            this._getModuleController(
                            spec.path, element, spec.options, spec.conditions));
                        }
                    }
                    else {
                        for (; i < l; i++) {
                            spec = specs[i];
                            controllers.push(
                            this._getModuleController(
                            spec[0], element, typeof spec[1] === 'string' ? spec[2] : spec[1], typeof spec[1] === 'string' ? spec[1] : spec[2]));
                        }
                    }

                }
                else if (config.length) {
                    controllers.push(
                    this._getModuleController(
                    config, element, element.getAttribute(_options.attr.options), element.getAttribute(_options.attr.conditions)));
                }

                return controllers;
            },

            /**
             * Module Controller factory method, creates different ModuleControllers based on params
             * @param path - path of module
             * @param element - element to attach module to
             * @param options - options for module
             * @param conditions - conditions required for module to be loaded
             * @returns {ModuleController}
             * @private
             */
            _getModuleController: function (path, element, options, conditions) {
                return new ModuleController(
                path, element, options, conditions ? new ConditionModuleAgent(conditions, element) : StaticModuleAgent);
            }

        };

        // conditioner options object
        _options = {
            'paths': {
                'monitors': './monitors/'
            },
            'attr': {
                'options': 'data-options',
                'module': 'data-module',
                'conditions': 'data-conditions',
                'priority': 'data-priority',
                'initialized': 'data-initialized',
                'processed': 'data-processed',
                'loading': 'data-loading'
            },
            'loader': {
                'require': function (paths, callback) {
                    require(paths, callback);
                },
                'config': function (path, options) {
                    var config = {};
                    config[path] = options;
                    requirejs.config({
                        config: config
                    });
                },
                'toUrl': function (path) {
                    return requirejs.toUrl(path);
                }
            },
            'modules': {}
        };

        // setup monitor factory
        _monitorFactory = new MonitorFactory();

        // setup loader instance
        _moduleLoader = new ModuleLoader();

        // expose API
        return {

            /**
             * Initialises the conditioner and parses the document for modules
             * @param {Object} [options] - optional options to override
             * @return {Array} of initialized nodes
             * @public
             */
            init: function (options) {

                if (options) {
                    this.setOptions(options);
                }

                return _moduleLoader.parse(doc);

            },

            /**
             * Set custom options
             * @param {Object} options - options to override
             * @public
             */
            setOptions: function (options) {

                if (!options) {
                    throw new Error('Conditioner.setOptions(options): "options" is a required parameter.');
                }

                var config, path, mod, alias;

                // update options
                _options = mergeObjects(_options, options);

                // fix paths if not ending with slash
                for (path in _options.paths) {

                    if (!_options.paths.hasOwnProperty(path)) {
                        continue;
                    }

                    // add slash if path does not end on slash already
                    _options.paths[path] += _options.paths[path].slice(-1) !== '/' ? '/' : '';
                }

                // loop over modules
                for (path in _options.modules) {

                    if (!_options.modules.hasOwnProperty(path)) {
                        continue;
                    }

                    // get module reference
                    mod = _options.modules[path];

                    // get alias
                    alias = typeof mod === 'string' ? mod : mod.alias;

                    // get config
                    config = typeof mod === 'string' ? null : mod.options || {};

                    // register this module
                    ModuleRegistry.registerModule(path, config, alias);

                }

            },

            /**
             * Loads all modules within the supplied dom tree
             * @param {Document|Element} context - Context to find modules in
             * @return {Array} - Array of found Nodes
             */
            parse: function (context) {

                if (!context) {
                    throw new Error('Conditioner.parse(context): "context" is a required parameter.');
                }

                return _moduleLoader.parse(context);

            },

            /**
             * Setup the given element with the passed module controller(s)
             * @param {Element} element - Element to bind the controllers to
             * @param {Array|ModuleController} controllers - module controller configurations
             * [
             *     {
             *         path: 'path/to/module',
             *         conditions: 'config',
             *         options: {
             *             foo: 'bar'
             *         }
             *     }
             * ]
             * @return {NodeController|null} - The newly created node or null if something went wrong
             */
            load: function (element, controllers) {

                return _moduleLoader.load(element, controllers);

            },

            /**
             * Returns a synced controller group which fires a load event once all modules have loaded
             * {ModuleController|NodeController} [arguments] - list of module controllers or node controllers to synchronize
             * @return SyncedControllerGroup.prototype
             */
            sync: function () {

                var group = Object.create(SyncedControllerGroup.prototype);

                // create synced controller group using passed arguments
                // test if user passed an array instead of separate arguments
                SyncedControllerGroup.apply(group, arguments.length === 1 && !arguments.slice ? arguments[0] : arguments);

                return group;

            },

            /**
             * Returns the first Node matching the selector
             * @param {String} [selector] - Selector to match the nodes to
             * @param {Element} [context] - Context to search in
             * @return {Node||null} First matched node or null
             */
            getNode: function (selector, context) {

                return _moduleLoader.getNodes(selector, context, true);

            },

            /**
             * Returns all nodes matching the selector
             * @param {String} [selector] - Optional selector to match the nodes to
             * @param {Element} [context] - Context to search in
             * @return {Array} Array containing matched nodes or empty Array
             */
            getNodes: function (selector, context) {

                return _moduleLoader.getNodes(selector, context, false);

            },

            /**
             * Destroy found nodes
             * Three possible use cases
             * 1.
             * @param {NodeController} arguments - destroy a single node controller
             *
             * 2.
             * @param {String} [arguments] - string to match elements
             * @param {Element} arguments - context in which to filter
             *
             * 3.
             * @param {Array} arguments - array containing NodeControllers
             *
             * @return {Boolean}
             * @public
             */
            destroy: function () {

                var nodes = [],
                    arg = arguments[0];

                // first argument is required
                if (!arg) {
                    throw new Error('Conditioner.destroy(...): A DOM node, Array, String or NodeController is required as the first argument.');
                }

                // test if is an array
                if (Array.isArray(arg)) {
                    nodes = arg;
                }

                // test if is query selector
                if (typeof arg === 'string') {
                    nodes = _moduleLoader.getNodes(arg, arguments[1]);
                }

                // test if is single NodeController instance
                else if (arg instanceof NodeController) {
                    nodes.push(arg);
                }

                // test if is DOMNode
                else if (arg.nodeName) {
                    nodes = _moduleLoader.getNodes().filter(function (node) {
                        return contains(arg, node.getElement());
                    });
                }

                // if we don't have any nodes to destroy let's stop here
                if (nodes.length === 0) {
                    return false;
                }

                return _moduleLoader.destroy(nodes);
            },

            /**
             * Returns the first Module matching the selector
             * @param {String} path - Optional path to match the modules to
             * @param {String} selector - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @public
             */
            getModule: function (path, selector, context) {

                var i = 0,
                    results = this.getNodes(selector, context),
                    l = results.length,
                    module;
                for (; i < l; i++) {
                    module = results[i].getModule(path);
                    if (module) {
                        return module;
                    }
                }
                return null;

            },

            /**
             * Returns multiple modules matching the given path
             * @param {String} path - Optional path to match the modules to
             * @param {String} selector - Optional selector to match the nodes to
             * @param {Document|Element} [context] - Context to search in
             * @returns {Array|Node|null}
             * @public
             */
            getModules: function (path, selector, context) {

                var i = 0,
                    results = this.getNodes(selector, context),
                    l = results.length,
                    filtered = [],
                    modules;
                for (; i < l; i++) {
                    modules = results[i].getModules(path);
                    if (modules.length) {
                        filtered = filtered.concat(modules);
                    }
                }
                return filtered;

            },

            /**
             * Manually run an expression, only returns once with a true or false state
             * @param {String} condition - Expression to test
             * @param {Element} [element] - Optional element to run the test on
             * @returns {Promise}
             */
            is: function (condition, element) {

                if (!condition) {
                    throw new Error('Conditioner.is(condition,[element]): "condition" is a required parameter.');
                }

                // run test and resolve with first received state
                var p = new Promise();
                WebContext.test(condition, element, function (valid) {
                    p.resolve(valid);
                });
                return p;

            },

            /**
             * Manually run an expression, bind a callback method to be executed once something changes
             * @param {String} condition - Expression to test
             * @param {Element} [element] - Optional element to run the test on
             * @param {Function} callback - callback method
             */
            on: function (condition, element, callback) {

                if (!condition) {
                    throw new Error('Conditioner.on(condition,[element],callback): "condition" and "callback" are required parameter.');
                }

                // handle optional element parameter
                callback = typeof element === 'function' ? element : callback;

                // run test and execute callback on change
                WebContext.test(condition, element, function (valid) {
                    callback(valid);
                });
            }

        };

    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(
        require, require('./utils/Observer'), require('./utils/Promise'), require('./utils/contains'), require('./utils/matchesSelector'), require('./utils/mergeObjects'));
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/conditioner',['require', './utils/Observer', './utils/Promise', './utils/contains', './utils/matchesSelector', './utils/mergeObjects'], factory);
    }
    // Browser globals
    else {
        throw new Error('To use ConditionerJS you need to setup a module loader like RequireJS.');
    }

}(document));

// setup requirejs
require.config({
    map:{
        '*':{
            'conditioner':'lib/rikschennink/conditioner',
            'utils/Observer':'lib/rikschennink/utils/Observer',
            'utils/mergeObjects':'lib/rikschennink/utils/mergeObjects'
        }
    },
    shim:{
        'lib/rikschennink/conditioner':[

            // DOMContentLoaded is required for addEventListener to shim the 'DOMContentLoaded' event
            'shim/DOMContentLoaded',
            'shim/addEventListener',

            // Other small shims
            'shim/Array.forEach',
            'shim/Array.indexOf',
            'shim/Array.isArray',
            'shim/Function.bind',
            'shim/Object.create',
            'shim/Object.keys'

        ],
        'lib/rikschennink/monitors/media':[
            'shim/matchMedia',
            'shim/matchMedia.addListener'
        ]
    }
});

// load conditioner
require(['conditioner'],function(conditioner) {

    conditioner.init({
        'modules':{
            'ui/StarGazers':{
                'options':{
                    'width':90,
                    'user':'rikschennink',
                    'repo':'conditioner'
                }
            },
            'ui/StorageConsentSelect':{
                'options':{
                    'label':{
                        'level':{
                            'incognito':'Incognito'
                        }
                    }
                }
            },
            'security/StorageConsentGuard':{
                'options':{
                    'levels':['all','incognito','none'],
                    'initial':'none'
                }
            }
        }
    });

});
define("main", function(){});

define('security/StorageConsentGuard',['utils/Observer','utils/mergeObjects','module'],function(Observer,mergeObjects,module){

    

    // StorageConsentGuard
    var StorageConsentGuard = function() {

        // current level
        this._level = null;

        // set options
        this.setOptions(module.config());

        // set default level
        this._setDefaultLevel();
    };

    var p = StorageConsentGuard.prototype;

    p.setOptions = function(options) {

        if (!options) {
            options = {};
        }

        // sets initial options
        this._options = mergeObjects({
            'initial':'all',
            'levels':['all','none']
        },options);

        this._setDefaultLevel();
    };

    p._setDefaultLevel = function() {
        this.setActiveLevel(this._options.initial);
    };

    p.getLevels = function() {
        return this._options.levels;
    };

    p.getActiveLevel = function() {
        return this._level;
    };

    p.setActiveLevel = function(level) {

        if (level == this._level) {
            return;
        }

        this._level = level;

        Observer.publish(this,'change',this._level);
    };


    // reference to singleton
    var _instance;

    return {
        getInstance:function() {
            if (!_instance) { _instance = new StorageConsentGuard(); }
            return _instance;
        }
    };

});
(function(){

    var factory = function(Observer,StorageConsentGuard){

        var _level = '';

        return {
            trigger:function(bubble){

                // listen to changes on storage guard
                var guard = StorageConsentGuard.getInstance();
                Observer.subscribe(guard,'change',function() {
                    _level = guard.getActiveLevel();
                    bubble();
                });

                // get default active level
                _level = guard.getActiveLevel();
            },
            parse:function(expected){
                return [{
                    'value':expected.split(',')
                }]
            },
            test:function(data){
                return data.expected.indexOf(_level) != -1;
            }
        };

    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(
            require('../utils/Observer'),
            require('security/StorageConsentGuard')
        );
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/monitors/cookies',['../utils/Observer',
                'security/StorageConsentGuard'],
            function(Observer,StorageConsentGuard){
                return factory(Observer,StorageConsentGuard);
            }
        );
    }

}());
/**
 * Tests if an active network connection is available and monitors this connection
 * @module monitors/connection
 */
(function (nav, win, undefined) {

    

    var exports = {
        trigger: {
            'online': win,
            'offline': win
        },
        test: {
            'any': function (data) {
                return data.expected;
            }
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/monitors/connection',[],function () {
            return exports;
        });
    }

}(navigator, window));
/**
 * Tests if an elements dimensions match certain expectations
 * @module monitors/element
 */
(function (win, doc, undefined) {

    

    var _isVisible = function (element) {
        var viewHeight = win.innerHeight,
            bounds = element.getBoundingClientRect();
        return (bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight);
    };

    var _toInt = function (value) {
        return parseInt(value, 10);
    };

    var exports = {
        data: {
            seen: false
        },
        trigger: {
            'resize': win,
            'scroll': win
        },
        test: {
            'seen': function (data) {
                if (!data.seen) {
                    data.seen = _isVisible(data.element);
                }
                return data.seen && data.expected;
            },
            'min-width': function (data) {
                return _toInt(data.expected) <= data.element.offsetWidth;
            },
            'max-width': function (data) {
                return _toInt(data.expected) >= data.element.offsetWidth;
            },
            'min-height': function (data) {
                return _toInt(data.expected) <= data.element.offsetHeight;
            },
            'max-height': function (data) {
                return _toInt(data.expected) >= data.element.offsetHeight;
            }
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/monitors/element',[],function () {
            return exports;
        });
    }

}(window, document));
/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */

if (window.addEventListener) {

    window.matchMedia = window.matchMedia || (function( doc, undefined ) {

        

        var bool,
            docElem = doc.documentElement,
            refNode = docElem.firstElementChild || docElem.firstChild,
        // fakeBody required for <FF4 when executed in <head>
            fakeBody = doc.createElement( "body" ),
            div = doc.createElement( "div" );

        div.id = "mq-test-1";
        div.style.cssText = "position:absolute;top:-100em";
        fakeBody.style.background = "none";
        fakeBody.appendChild(div);

        return function(q){

            div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

            docElem.insertBefore( fakeBody, refNode );
            bool = div.offsetWidth === 42;
            docElem.removeChild( fakeBody );

            return {
                matches: bool,
                media: q
            };

        };

    }( document ));


}
;
define("shim/matchMedia", function(){});

/*! matchMedia() polyfill addListener/removeListener extension. Author & copyright (c) 2012: Scott Jehl. Dual MIT/BSD license */
if (window.addEventListener) {

    (function(){

        // monkeypatch unsupported addListener/removeListener with polling
        if (!window.matchMedia('(min-width:0)').addListener) {

            var oldMM = window.matchMedia;

            window.matchMedia = function( q ){
                var ret = oldMM( q ),
                    listeners = [],
                    last = false,
                    timer,
                    check = function(){
                        var list = oldMM( q ),
                            unmatchToMatch = list.matches && !last,
                            matchToUnmatch = !list.matches && last;

                                            //fire callbacks only if transitioning to or from matched state
                        if( unmatchToMatch || matchToUnmatch ){
                            for( var i =0, il = listeners.length; i< il; i++ ){
                                listeners[ i ].call( ret, list );
                            }
                        }
                        last = list.matches;
                    };

                ret.addListener = function( cb ){
                    listeners.push( cb );
                    if( !timer ){
                        timer = setInterval( check, 1000 );
                    }
                };

                ret.removeListener = function( cb ){
                    for( var i =0, il = listeners.length; i< il; i++ ){
                        if( listeners[ i ] === cb ){
                            listeners.splice( i, 1 );
                        }
                    }
                    if( !listeners.length && timer ){
                        clearInterval( timer );
                    }
                };

                return ret;
            };
        }
    }());

};
define("shim/matchMedia.addListener", function(){});

/**
 * Tests if a media query is matched or not and listens to changes
 * @module monitors/media
 */
(function (win, undefined) {

    

    var exports = {
        unique: true,
        data: {
            mql: null
        },
        trigger: function (bubble, data) {

            // if testing for support don't run setup
            if (data.expected === 'supported') {
                return;
            }

            // if is media query
            data.mql = win.matchMedia(data.expected);
            data.mql.addListener(function () {
                bubble();
            });

        },
        parse: function (expected) {
            var results = [];
            if (expected === 'supported') {
                results.push({
                    test: 'supported',
                    value: true
                });
            }
            else {
                results.push({
                    test: 'query',
                    value: expected
                });
            }
            return results;
        },
        test: {
            'supported': function () {
                return 'matchMedia' in win;
            },
            'query': function (data) {
                return data.mql.matches;
            }
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/monitors/media',[],function () {
            return exports;
        });
    }

}(window));
/**
 * Tests if the user is using a pointer device
 * @module monitors/pointer
 */
(function (win, doc, undefined) {

    

    var _pointerEventSupport = win.PointerEvent || win.MSPointerEvent;
    var _pointerEventName = win.PointerEvent ? 'pointermove' : 'MSPointerMove';
    var _shared = {
        available: false,
        moves: 0,
        movesRequired: 2
    };

    var exports = {
        trigger: function (bubble) {

            // filter events
            var filter = function filter(e) {

                // handle pointer events
                if (_pointerEventSupport) {

                    // only available if is mouse or pen
                    _shared.available = e.pointerType === 4 || e.pointerType === 3;

                    // if not yet found, stop here, support could be found later
                    if (!_shared.available) {
                        return;
                    }

                    // clean up the mess
                    doc.removeEventListener(_pointerEventName, filter, false);

                    // handle the change
                    bubble();

                    // no more!
                    return;
                }

                // stop here if no mouse move event
                if (e.type !== 'mousemove') {
                    _shared.moves = 0;
                    return;
                }

                // test if the user has fired enough mouse move events
                if (++_shared.moves >= _shared.movesRequired) {

                    // stop listening to events
                    doc.removeEventListener('mousemove', filter, false);
                    doc.removeEventListener('mousedown', filter, false);

                    // trigger
                    _shared.available = true;

                    // handle the change
                    bubble();
                }
            };

            // if pointer events supported use those as they offer more granularity
            if (_pointerEventSupport) {
                doc.addEventListener(_pointerEventName, filter, false);
            }
            else {
                // start listening to mousemoves to deduce the availability of a pointer device
                doc.addEventListener('mousemove', filter, false);
                doc.addEventListener('mousedown', filter, false);
            }

        },
        test: {
            'hovers': function (data) {
                return _shared.available === data.expected;
            }
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/monitors/pointer',[],function () {
            return exports;
        });
    }

}(window, document));
/**
 * Tests if the window dimensions match certain expectations
 * @module monitors/window
 */
(function (win, doc, undefined) {

    

    var _width = function () {
        return win.innerWidth || doc.documentElement.clientWidth;
    };
    var _height = function () {
        return win.innerHeight || doc.documentElement.clientHeight;
    };
    var _toInt = function (value) {
        return parseInt(value, 10);
    };

    var exports = {
        trigger: {
            'resize': win
        },
        test: {
            'min-width': function (data) {

                console.log('min',data.expected,'<=',_width());

                return _toInt(data.expected) <= _width();
            },
            'max-width': function (data) {

                console.log('max',data.expected,'>=',_width());

                return _toInt(data.expected) >= _width();
            },
            'min-height': function (data) {
                return _toInt(data.expected) <= _height();
            },
            'max-height': function (data) {
                return _toInt(data.expected) >= _height();
            }
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('lib/rikschennink/monitors/window',[],function () {
            return exports;
        });
    }

}(window, document));
define('ui/Clock',[],function(){

    

    // adds leading zero's
    var _pad = function(n){return n<10 ? '0'+n : n;};

    // Clock Class
    var exports = function(element,options) {

        // set default options
        this._element = element;
        this._options = options;

        // set time holder
        this._time = document.createElement('p');

        // start ticking
        this._tick();

        // add element
        this._element.appendChild(this._time);
    };

    // default options
    exports.options = {
        'time':true
    };

    // update time
    exports.prototype._tick = function() {

        var self = this,
            now = new Date(),
            date = _pad(now.getDate()) + '/' + (now.getMonth()+1) + '/'+ now.getFullYear(),
            time = _pad(now.getHours()) + ':' + _pad(now.getMinutes()) + ':' + _pad(now.getSeconds());

        // write inner html
        this._time.textContent = date + (this._options.time ? ' - ' + time : '');

        // if time is not enabled, don't start ticking
        if (!this._options.time) {
            return;
        }

        // wait timeout milliseconds till next clock tick
        this._timer = setTimeout(function(){
            self._tick();
        },900);

    };

    // unload clock
    exports.prototype.unload = function() {

        // stop ticking
        clearTimeout(this._timer);

        // restore content
        //this._element.innerHTML = this._inner;
        this._time.parentNode.removeChild(this._time);

    };

    return exports;

});
define('ui/Zoom',[],function(){

    

    var exports = function(element,options) {

        this._element = element;
        this._options = options;

        this._btn = document.createElement('button');
        this._btn.textContent = 'zoom in';
        this._btn.addEventListener('click',this,false);
        this._element.appendChild(this._btn);

    };

    exports.options = {
        fontSize:'2em'
    };

    exports.prototype = {

        handleEvent:function(e) {
            if (e.type === 'click'){
                if (!this._element.style.fontSize) {
                    this._zoomIn();
                }
                else {
                    this._zoomOut();
                }
            }
        },

        _zoomIn:function() {
            this._btn.textContent = 'zoom out';
            this._element.style.fontSize = this._options.fontSize;
        },

        _zoomOut:function() {
            this._btn.textContent = 'zoom in';
            this._element.style.fontSize = null;
        },

        unload:function() {

            // restore scale
            this._zoomOut();

            // remove button
            this._btn.removeEventListener('click',this,false);
            this._btn.parentNode.removeChild(this._btn);

        }

    };

    return exports;

});
define('ui/StorageConsentSelect',['security/StorageConsentGuard'],function(StorageConsentGuard){

    

    // StorageConsentSelect Class
    var exports = function(element,options) {

        // default options for this class
        this._element = element;
        this._options = options;

        // set reference to storage guard
        this._storageGuard = StorageConsentGuard.getInstance();

        // store inner HTML
        this._inner = this._element.innerHTML;

        // options
        var level,levels = this._options.label.level,html = '';
        for (level in levels) {
            if (!levels.hasOwnProperty(level)) {
                continue;
            }
            html += '<option' + (level == this._storageGuard.getActiveLevel() ? ' selected="selected"': '') + ' value="' + level + '">' + this._options.label.level[level] + '</option>';
        }

        // setup select
        this._element.innerHTML = '<label for="storage-consent">' + this._options.label.select + '</label>' +
                                  '<select id="storage-consent">' + html + '</select>';

        // listen to changes on select
        this._element.querySelector('select').addEventListener('change',this);

    };

    // default module options
    exports.options = {
        'label':{
            'select':'Cookies',
            'level':{
                'all':'All',
                'none':'None'
            }
        }
    };

    // Handle events
    exports.prototype.handleEvent = function(e) {
        if (e.type === 'change') {
            var select = this._element.querySelector('select'),
                value = select.options[select.selectedIndex].value;

            // set active level
            this._storageGuard.setActiveLevel(value);
        }
    };

    // Unload StorageConsentSelect module
    exports.prototype.unload = function() {

        // remove event listener
        this._element.querySelector('select').removeEventListener('change',this);

        // restore original content
        this._element.innerHTML = this._inner;

    };

    return exports;

});
define('ui/StarGazers',[],function(){

    

    // StarGazers Class
    var exports = function(element,options) {

        // set element and options reference
        this._element = element;
        this._options = options;

        // backup content
        this._inner = this._element.innerHTML;

        // load stargazer
        this._load();
    };

    // default options
    exports.options = {
        'user':'mdo',
        'repo':'github-buttons',
        'width':80,
        'height':20,
        'count':true,
        'type':'watch'
    };

    // load component
    exports.prototype._load = function() {
        this._element.innerHTML = '<iframe src="http://ghbtns.com/github-btn.html?user=' + this._options.user + '&repo=' + this._options.repo + '&type=' + this._options.type + '&count=' + this._options.count + '"' +
            'allowtransparency="true" ' +
            'frameborder="0" ' +
            'scrolling="0" ' +
            'width="' + this._options.width + '" ' +
            'height="' + this._options.height + '"></iframe>';
    };

    // unload stargazers
    exports.prototype.unload = function() {

        // restore content
        this._element.innerHTML = this._inner;

    };

    return exports;

});