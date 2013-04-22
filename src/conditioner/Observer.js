
/**
 * @class Observer
 */
var Observer = (function(){

    return {

        /**
         * Subscribe to an event
         * @method subscribe
         * @param {object} obj - Object to subscribe to
         * @param {string} type - Event type to listen for
         * @param {Function} fn - Function to call when event fires
         */
        subscribe:function(obj,type,fn) {

            if (!obj._subscriptions) {
                obj._subscriptions = [];
            }

            // check if already added
            var test,i=0,l = obj._subscriptions;
            for (; i<l; i++) {
                test = obj._subscriptions[i];
                if (test.type == type && test.fn == fn) {
                    return;
                }
            }

            // add event
            obj._subscriptions.push({'type':type,'fn':fn});
        },

        /**
         * Unsubscribe from further notifications
         * @method unsubscribe
         * @param {object} obj - Object to unsubscribe from
         * @param {string} type - Event type to match
         * @param {Function} fn - Function to match
         */
        unsubscribe:function(obj,type,fn) {

            if (!obj._subscriptions) {
                return;
            }

            // find and remove
            var test,i;
            for (i = obj._subscriptions.length-1; i >= 0; i--) {
                test = obj._subscriptions[i];
                if (test.type == type && test.fn == fn) {
                    obj._subscriptions.splice(i,1);
                    break;
                }
            }
        },

        /**
         * Publish an event
         * @method publish
         * @param {object} obj - Object to fire the event on
         * @param {string} type - Event type to fire
         * @param {object} data - Any type of data
         */
        publish:function(obj,type,data) {

            if (!obj._subscriptions) {
                obj._subscriptions = [];
            }
            
            // find and execute callback
            var subscriptions=[],subscription,i=0,l = obj._subscriptions.length;
            for (;i<l; i++) {
                subscription = obj._subscriptions[i];
                if (subscription.type == type) {
                    subscriptions.push(subscription);
                }
            }

            // call callbacks
            l = subscriptions.length;
            for (i=0;i<l;i++) {
                subscriptions[i].fn(data)
            }

            // see if should be propagated
            if (obj._eventPropagationTarget) {
                this.publish(obj._eventPropagationTarget,type,data);
            }

        },

        /**
         * Setup propagation target for events so they can bubble up the object tree
         * @method setupPropagationTarget
         * @param {object} obj - Object to set as origin
         * @param {object} target - Object to set as target
         */
        setupPropagationTarget:function(obj,target) {
            if (!obj) {
                return;
            }
            obj._eventPropagationTarget = target;
        },

        removePropagationTarget:function(obj,target) {
            if (!obj) {
                return;
            }
            obj._eventPropagationTarget = null;
        }

    };

}());
