module.exports = function(grunt) {

    grunt.initConfig({
        pkg:grunt.file.readJSON('package.json'),
        path:{
            src:'src/',
            demo:'demo/',
            conditioner:'<%= path.src %>conditioner/',
            wrapper:'<%= path.src %>wrapper/',
            tests:'<%= path.src %>tests/'
        },
        meta: {
            banner: '// <%= pkg.name %> v<%= pkg.version %> - <%= pkg.description %>\n' +
                    '// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> - <%= pkg.homepage %>\n' +
                    '// License: <%= _.map(pkg.licenses, function(x) {return x.type + " (" + x.url + ")";}).join(", ") %>\n'
        },
        concat:{
            options: {
                banner:'<%= meta.banner %>'
            },
            dist:{
                src:[
                    '<%= meta.banner %>',
                    '<%= path.wrapper %>intro.js',

                    '<%= path.conditioner %>mergeObjects.js',
                    '<%= path.conditioner %>matchesSelector.js',
                    '<%= path.conditioner %>Observer.js',

                    '<%= path.conditioner %>Module.js',
                    '<%= path.conditioner %>Test.js',
                    '<%= path.conditioner %>ModuleRegister.js',
                    '<%= path.conditioner %>ConditionManager.js',
                    '<%= path.conditioner %>ModuleController.js',
                    '<%= path.conditioner %>Conditioner.js',

                    '<%= path.wrapper %>outro.js'
                ],
                dest:'dist/<%= pkg.name %>.js'
            }
        },
        copy: {
            tests: {
                expand:true,
                cwd: '<%= path.tests %>',
                src:'*',
                dest:'dist/tests/'
            },
            demo: {
                expand:true,
                cwd: '<%= path.tests %>',
                src:'*',
                dest:'<%= path.demo %>js/tests/'
            }
        },
        uglify: {
            tests: {
                expand: true,
                src: '*',
                dest: 'dist/tests.min/',
                cwd: '<%= copy.tests.dest %>'
            },
            lib: {
                options: {
                    banner:'<%= meta.banner %>',
                    report:'gzip'
                },
                src: '<%= concat.dist.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        requirejs: {
            compile: {
                options: {

                    preserveLicenseComments:false,
                    findNestedDependencies:true,
                    optimize:'none',

                    baseUrl:'<%= path.demo %>js/',
                    paths:{
                        'Conditioner':'../../dist/conditioner'
                    },

                    name:'lib/jrburke/require',
                    out:'<%= path.demo %>/js.min/built.js',
                    include:[
                        'Conditioner',
                        'tests/Connection',
                        'tests/Cookies',
                        'tests/Element',
                        'tests/Media',
                        'tests/Pointer',
                        'tests/Window',
                        'ui/Clock',
                        'ui/StorageConsentSelect',
                        'security/StorageConsentGuard'
                    ]

                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-requirejs');


    // build everything
    grunt.registerTask('default',['concat','copy','uglify','requirejs']);

    // task for building the library
    grunt.registerTask('lib',['concat','copy','uglify']);

    // task for optimizing the demo
    grunt.registerTask('demo',['requirejs']);

};