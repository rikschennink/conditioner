({

    allowSourceOverwrites:true,
    preserveLicenseComments:false,
    findNestedDependencies:true,
    optimize:'none', //uglify2

    // Location of app source (src)
    appDir:'./js',

    // Target location of app (dest), copy all files under appDir to this location
    dir:'./js.min',

    // get configuration
    mainConfigFile:'./js/main.js',

    // Override base url in main.js
    baseUrl:'../js.min/',

    // Core modules to merge
    modules:[
        {
            name:'main',
            include:[

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
        }
    ]

})