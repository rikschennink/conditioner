{
    /**
     * Which events on which object trigger
     * the monitor to run it's tests.
     */
    trigger: {
        'resize':window,
        'scroll':window
    },

    /**
     * Possible values this monitor can test for.
     * foo relates to the name of the test.
     * monitor:{foo:bar}
     *
     * The data object contains the expected value and the element.
     * {element:<node>,expected:<value>}
     */
    test:{
        foo:function(data) {
            return data.expected === 'bar';
        }
    }
}