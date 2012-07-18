/*
 * Observer
 */

(function(){

    var Observer = {

        // subscribe to event
        subscribe:function(obj,type,fn) {

            if (!obj._listeners) {
                obj._listeners = new Array();
            }

            // check if already added
            var test,i,l = obj._listeners;
            for (i=0; i<l; i++) {
                test = obj._listeners[i];
                if (test.type === type && test.fn === fn) {
                    return;
                }
            }

            // add event
            obj._listeners.push({'type':type,'fn':fn});
        },

        // unsubscribe from event
        unsubscribe:function() {

            if (!obj._listeners) {
                return;
            }

            // find and remove
            var test,i;
            for (i = obj._listeners.length-1; i >= 0; i--) {
                test = obj._listeners[i];
                if (test.type === type && test.fn === fn) {
                    obj._listeners.splice(i,1);
                    break;
                }
            }

        },

        // fire event
        fire:function(obj,type,data) {

            if (!obj._listeners) {
                obj._listeners = new Array();
            }

            // find and execute callback
            var test,i,l = obj._listeners.length;
            for (i=0; i<l; i++) {
                test = obj._listeners[i];
                if (test.type === type) {
                    test.fn(data);
                }
            }
        }
    };

    Namespace.register('bc.helper').Observer = Observer;

}());
