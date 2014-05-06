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
                    optimize:'uglify2',

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

                }
            }
        },
        jshint:{
            options:{
                jshintrc:'.jshintrc'
            },
            all:[
                '<%=path.js %>/ui/*.js'
            ]
        },
        uglify:{

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
        jekyll:{
            server:{
                src:'./',
                dest:'_site',
                server:true,
                port:4000,
                watch:true,
                safe:true,
                config:'./_config-local.yml'
            },
            build:{
                src:'./',
                dest:'_site',
                config:'./_config-local.yml'
            }
        },
        watch: {
            js:{
                files:['./js/**/*'],
                tasks:['jshint','requirejs','uglify','jekyll:build']
            },
            css:{
                files:['./sass/**/*'],
                tasks:['sass','jekyll:build']
            },
            html:{
                files:['_includes/*','_layouts/*','index.html'],
                tasks:['jekyll:build']
            }
        }
    });

    // if jekyll is giving you problems related to encoding on osx,
    // run "export LC_ALL=en_US.UTF-8;"
    // https://github.com/jekyll/jekyll/issues/960

    // tasks
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jekyll');


    // build all the things
    grunt.registerTask('build',['jshint','sass','requirejs']);


    // setup dev server
    grunt.registerTask('dev',['build','jekyll:server'])

};