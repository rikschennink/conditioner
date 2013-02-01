/**
 * @module Observer
 */
var Observer = (function(){

    'use strict';

    return {

        /**
         * Subscribe to an event
         * @method subscribe
         * @param {Object} obj - Object to subscribe to
         * @param {String} type - Event type to listen for
         * @param {Function} fn - Function to call when event fires
         */
        subscribe:function(obj,type,fn) {

            if (!obj._eventListeners) {
                obj._eventListeners = [];
            }

            // check if already added
            var test,i=0,l = obj._eventListeners;
            for (; i<l; i++) {
                test = obj._eventListeners[i];
                if (test.type == type && test.fn == fn) {
                    return;
                }
            }

            // add event
            obj._eventListeners.push({'type':type,'fn':fn});
        },

        /**
         * Unsubscribe from further notifications
         * @method unsubscribe
         * @param {Object} obj - Object to unsubscribe from
         * @param {String} type - Event type to match
         * @param {Function} fn - Function to match
         */
        unsubscribe:function(obj,type,fn) {

            if (!obj._eventListeners) {
                return;
            }

            // find and remove
            var test,i;
            for (i = obj._eventListeners.length-1; i >= 0; i--) {
                test = obj._eventListeners[i];
                if (test.type == type && test.fn == fn) {
                    obj._eventListeners.splice(i,1);
                    break;
                }
            }
        },

        /**
         * Publish an event
         * @method publish
         * @param {Object} obj - Object to fire the event on
         * @param {String} type - Event type to fire
         * @param {Object} data - Any type of data
         */
        publish:function(obj,type,data) {

            if (!obj._eventListeners) {
                obj._eventListeners = [];
            }
            
            // find and execute callback
            var test,i=0,l = obj._eventListeners.length;
            for (; i<l; i++) {
                test = obj._eventListeners[i];
                if (test.type == type) {
                    test.fn(data);
                }
            }

            // see if should be propagated
            if (obj._eventPropagationTarget) {
                Observer.publish(obj._eventPropagationTarget,type,data);
            }

        },

        /**
         * Setup propagation target for events so they can bubble up the object tree
         * @method setupPropagationTarget
         * @param {Object} obj - Object to set as origin
         * @param {Object} target - Object to set as target
         */
        setupPropagationTarget:function(obj,target) {
            obj._eventPropagationTarget = target;
        }

    };

}());
