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
                        'conditioner':'lib/rikschennink/conditioner-0.8.5.min'
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
            options:{
                jshintrc:'.jshintrc'
            },
            all:[
                '<%=path.js %>/ui/*.js',
                '<%=path.js %>/js/tests/*.js'
            ]
        },
        sass:{
            dist: {
                files: {
                    'css/styles.css':'sass/styles.scss'
                },
                options:{
                    style:'compressed'
                }
            }
        },
        watch: {
            files: ['sass/**/*'],
            tasks: ['sass', 'reload']
        }
    });


    // reload chrome on save
    grunt.registerTask("reload", "reload Chrome on OS X",
        function() {
            require("child_process").exec("osascript " +
                "-e 'tell application \"Google Chrome\" " +
                "to tell the active tab of its first window' " +
                "-e 'reload' " +
                "-e 'end tell'");
        }
    );


    // tasks
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');


    // build all the things
    grunt.registerTask('default',['jshint','sass','requirejs']);

};