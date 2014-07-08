(function (win, undefined) {

    'use strict';

    // Promise
    // https://gist.github.com/rikschennink/11279384 (fork)
    var exports = function Promise() {
        this._thens = [];
    };

    exports.prototype = {

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
            /* jshint unused:false*/
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
            var aThen;
            var i = 0; /* jshint -W084 */
            /* jshint -W030 */
            while (aThen = this._thens[i++]) {
                aThen[which] && aThen[which](arg);
            }
            delete this._thens;
        }

    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return exports;
        });
    }
    // Browser globals
    else {
        win.Promise = exports;
    }

}(this));