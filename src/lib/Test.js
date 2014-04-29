/**
 * Test
 * @param {String} path to monitor
 * @param {String} expected value
 * @constructor
 */
var Test = function(path,expected){

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
    getPath:function(){
        return this._path;
    },

    /**
     * Returns the expected value
     * @returns {String}
     */
    getExpected:function(){
        return this._expected;
    },

    /**
     * Returns true if monitor currently returns true state
     * @returns {Boolean}
     */
    isTrue:function(){
        var i= 0,l=this._count;
        for (;i<l;i++) {
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
    assignWatches:function(watches){
        this._watches = watches;
        this._count = this._watches.length;
    },

    /**
     * Returns test in path
     * @returns {String}
     */
    toString:function(){
        return this._path + ':{' + this._expected + '}';
    }

};