/**
 * @module Options
 */
var Options = (function(){

    return {

        /**
         * Merges custom options passed for behavior with original behavior options
         * http://stackoverflow.com/a/383245/1774081
         * @method merge
         * @param {Object} obj1 - Object 1
         * @param {Object} obj2 - Object 2
         * @return {Object} result of merger
         */
        merge:function(obj1, obj2) {

            if (!obj1) {
                return obj2;
            }

            for (var p in obj2) {
                if (!obj2.hasOwnProperty(p)){continue;}
                try {
                    // Property in destination object set; update its value.
                    if (obj2[p].constructor==Object ) {
                        obj1[p] = this.merge(obj1[p], obj2[p]);

                    } else {
                        obj1[p] = obj2[p];

                    }

                } catch(e) {
                    // Property in destination object not set; create it and set its value.
                    obj1[p] = obj2[p];

                }
            }

            return obj1;
        }
    }

}());