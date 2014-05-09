({

    preserveLicenseComments:false,
    findNestedDependencies:true,
    optimize:'uglify',

    // Target location of app (dest), copy all files under appDir to this location
    out:'./js/main.min.js',

    // get configuration
    mainConfigFile:'./js/main.js',

    // include these modules
    include:[

        // include the main js file
        'main',

        // custom test
        'lib/rikschennink/monitors/cookies',

        // default tests
        'lib/rikschennink/monitors/connection',
        'lib/rikschennink/monitors/element',
        'lib/rikschennink/monitors/media',
        'lib/rikschennink/monitors/pointer',
        'lib/rikschennink/monitors/window',

        // ui modules
        'ui/Clock',
        'ui/Zoom',
        'ui/StorageConsentSelect',
        'ui/StarGazers',
        'security/StorageConsentGuard'

        // not included to test conditional loading
        // 'ui/Map'

    ]

})