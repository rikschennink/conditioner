
    // singleton reference
    var _instance;

    // expose
    return {

        /**
         * Reference to Observer class
         * @type {Observer}
         */
        Observer:Observer,

        /**
         * Reference to TestBase Class
         * @memberof module:conditioner
         */
        TestBase:TestBase,

        /**
         * Reference to ModuleBase Class
         * @memberof module:conditioner
         */
        ModuleBase:ModuleBase,

        /**
         * Reference to mergeObject method
         * @memberof module:conditioner
         */
        mergeObjects:Utils.mergeObjects,

        /**
         * Returns an instance of the Conditioner
         * @return {Conditioner}
         */
        getInstance:function() {
            if (!_instance) {_instance = new Conditioner();}
            return _instance;
        }
    };

});
