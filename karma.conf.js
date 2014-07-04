module.exports = function(config) {

    var settings = {

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        frameworks: ['requirejs','mocha','chai'],


        // list of files / patterns to load in the browser
        files: [

            'spec/shim/Function.bind.js',

            'src/lib/Test.js',
            'src/lib/Condition.js',
            'src/lib/MonitorFactory.js',
            'src/lib/WebContext.js',
            'src/lib/UnaryExpression.js',
            'src/lib/BinaryExpression.js',
            'src/lib/ExpressionParser.js',
            'src/lib/ModuleRegistry.js',
            'src/lib/ModuleController.js',
            'src/lib/NodeController.js',
            'src/lib/SyncedControllerGroup.js',
            'src/lib/StaticModuleAgent.js',
            'src/lib/ConditionModuleAgent.js',
            'src/lib/ModuleLoader.js',

            'test-main.js',

            {
                pattern: 'src/**/*.js', included: false
            },
            {
                pattern: 'spec/**/*.js', included: false
            }
        ],


        // list of files to exclude
        exclude: [],


        // preprocess matching files before serving them to the browser
        preprocessors: {
            'src/**/*.js':'coverage'
        },

        // how and where to do coverage reporting
        coverageReporter: {
            type : 'lcov',
            dir : 'coverage/'
        },

        // test results reporters to use
        reporters:['mocha','coverage'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true

    };

    // if running on travis
    if (process.env.TRAVIS) {
        settings.reports.push('coveralls');
    }

    config.set(settings);
};
