module.exports = function(grunt) {

    grunt.initConfig({
        pkg:grunt.file.readJSON('package.json'),
        path:{
            js:'js'
        },
        requirejs: {
            compile: {
                options: {

                    preserveLicenseComments:false,
                    findNestedDependencies:true,
                    optimize:'none',

                    baseUrl:'js/',
                    paths:{
                        'conditioner':'lib/rikschennink/conditioner.min'
                    },

                    name:'lib/jrburke/require',
                    out:'js.min/built.js',
                    include:[
                        'conditioner',

                        // custom test
                        'tests/cookies',

                        // default tests
                        'tests/connection',
                        'tests/element',
                        'tests/media',
                        'tests/pointer',
                        'tests/window',

                        // ui modules
                        'ui/Clock',
                        'ui/StorageConsentSelect',
                        'security/StorageConsentGuard'
                        // 'ui/Map'
                        // not included to test conditional loading

                    ]
                }
            }
        },
        jshint:{
            all:[
                '<%=path.js %>/ui/*.js',
                '<%=path.js %>/js/tests/*.js'
            ]
        }

    });


    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');


    // build all the things
    grunt.registerTask('default',['jshint','requirejs']);

};