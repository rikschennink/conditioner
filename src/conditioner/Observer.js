/**
 * @namespace Observer
 */
var Observer = {

	/**
	 * Subscribe to an event
	 * @memberof Observer
	 * @param {Object} obj - Object to subscribe to
	 * @param {String} type - Event type to listen for
	 * @param {Function} fn - Function to call when event fires
	 * @static
	 */
	subscribe:function(obj,type,fn) {

		if (!obj._subscriptions) {
			obj._subscriptions = [];
		}

		// check if already added
		var test,i=0,l=obj._subscriptions;
		for (; i<l; i++) {
			test = obj._subscriptions[i];
			if (test.type === type && test.fn === fn) {
				return;
			}
		}

		// add event
		obj._subscriptions.push({'type':type,'fn':fn});
	},

	/**
	 * Unsubscribe from further notifications
	 * @memberof Observer
	 * @param {Object} obj - Object to unsubscribe from
	 * @param {String} type - Event type to match
	 * @param {Function} fn - Function to match
	 * @static
	 */
	unsubscribe:function(obj,type,fn) {

		if (!obj._subscriptions) {
			return;
		}

		// find and remove
		var test,i=obj._subscriptions.length;
		while (--i >= 0) {
			test = obj._subscriptions[i];
			if (test.type === type && test.fn === fn) {
				obj._subscriptions.splice(i,1);
				break;
			}
		}
	},

	/**
	 * Publish an event
	 * @memberof Observer
	 * @param {Object} obj - Object to fire the event on
	 * @param {String} type - Event type to fire
	 * @param {Object} [data] - optional data carrier
	 * @static
	 */
	publish:function(obj,type,data) {

		if (!obj._subscriptions) {
			obj._subscriptions = [];
		}

		// find and execute callback
		var subscriptions=[],subscription,i=0,l = obj._subscriptions.length;
		for (;i<l;i++) {
			subscription = obj._subscriptions[i];
			if (subscription.type === type) {
				subscriptions.push(subscription);
			}
		}

		// call callbacks
		l = subscriptions.length;
		for (i=0;i<l;i++) {
			subscriptions[i].fn(data);
		}

		// see if any receivers should be informed
		if (obj._receivers) {
			l = obj._receivers.length;
			for (i=0;i<l;i++) {
				this.publish(obj._receivers[i],type,data);
			}
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
	inform:function(informant,receiver) {

		if (!informant || !receiver) {
			return false;
		}

		if (!informant._receivers) {
			informant._receivers = [];
		}

		informant._receivers.push(receiver);

		return true;
	},

	/**
	 * Remove propagation target
	 * @memberof Observer
	 * @param {Object} informant - Object set as origin
	 * @param {Object} receiver - Object set as target
	 * @return {Boolean} if removed successful
	 * @static
	 */
	conceal:function(informant,receiver) {

		if (!informant || !receiver || !informant._receivers) {
			return false;
		}

		// find and remove
		var item,i=informant._receivers.length;
		while (--i >= 0) {
			item = informant._receivers[i];
			if (item === receiver) {
				informant._receivers.splice(i,1);
				return true;
			}
		}

		return false;
	}
};