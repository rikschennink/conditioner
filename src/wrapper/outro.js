
    // singleton reference
    var _instance;

    // expose conditioner
    return {

        /**
         * Returns an instance of the Conditioner
         * @return {Conditioner}
         */
        getInstance:function() {
            if (!_instance) {_instance = new Conditioner();}
            return _instance;
        },

        /**
         * Reference to Test base class
         * @static
         */
        Test:Test,

        /**
         * Reference to Module base class
         * @static
         */
        Module:Module,

        /**
         * Reference to Observer class
         * @type {object}
         */
        Observer:Observer,

        /**
         * Reference to mergeObject method
         * @type {function}
         */
        mergeObjects:mergeObjects

    };

});
