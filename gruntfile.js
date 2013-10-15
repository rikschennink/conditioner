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

                    baseUrl:'js/',
                    paths:{
                        'conditioner':'lib/rikschennink/conditioner-0.9.0.min'
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
                        'ui/StarGazers',
                        'security/StorageConsentGuard'

                        // 'ui/Map' not included to test conditional loading

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
                '<%=path.js %>/tests/*.js'
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
            css:{
                files: ['./sass/**/*'],
                tasks: ['sass']
            },
            html:{
                files:['_includes/*','_layouts/*','index.html'],
                tasks:['jekyll:build']
            }
        }
    });


    // tasks
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-jekyll');


    // build all the things
    grunt.registerTask('build',['jshint','sass','requirejs']);


    // setup dev server
    grunt.registerTask('develop',['build','jekyll:server'])

};