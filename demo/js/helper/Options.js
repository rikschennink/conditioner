
var Options = (function(){

    return {

        /**
         * Merges custom options passed for behavior with original behavior options
         * @method merge
         * @param {Object} original - The original options
         * @param {Object} changes - The custom options
         */
        merge:function(original,changes) {

            if (typeof changes == 'undefined') {
                return original;
            }

            if (typeof original == 'undefined') {
                return changes;
            }

            // merge with custom generic options
            var key,result = {};
            for (key in original) {

                if (!original.hasOwnProperty(key)) {
                    continue;
                }

                // if no changes, result becomes original
                if (typeof changes == 'undefined') {
                    result[key] = original[key];
                    continue;
                }

                result[key] = this._mergeOption(original[key],changes[key]);
            }

            // add new changes
            for (key in changes) {

                if (!changes.hasOwnProperty(key) || original.hasOwnProperty(key)) {
                    continue;
                }

                result[key] = this._mergeOption(original[key],changes[key]);
            }

            return result;

        },

        _mergeOption:function(original,change) {

            if (typeof original != 'object') {
                return typeof change == 'undefined' ? original : change;
            }

            return this.merge(original,change);

        }

    };

}());