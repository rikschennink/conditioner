module.exports = function(grunt) {

    grunt.initConfig({
        pkg:grunt.file.readJSON('package.json'),
        path:{
            src:'src',
            spec:'spec',
            conditioner:'<%= path.src %>/conditioner',
            wrapper:'<%= path.src %>/wrapper',
            tests:'<%= path.src %>/tests'
        },
        meta: {
            banner: '// <%= pkg.name %> v<%= pkg.version %> - <%= pkg.description %>\n' +
                    '// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> - <%= pkg.homepage %>\n' +
                    '// License: <%= _.map(pkg.licenses, function(x) {return x.type + " (" + x.url + ")";}).join(", ") %>\n'
        },
        jasmine:{
            src:[
                '<%= path.conditioner %>/Utils.js',
                '<%= path.conditioner %>/Observer.js',
                '<%= path.conditioner %>/ExpressionBase.js',
                '<%= path.conditioner %>/UnaryExpression.js',
                '<%= path.conditioner %>/BinaryExpression.js',
                '<%= path.conditioner %>/ExpressionFormatter.js',
                '<%= path.conditioner %>/ConditionsManager.js',
                '<%= path.conditioner %>/ModuleRegister.js',
                '<%= path.conditioner %>/ModuleController.js',
                '<%= path.conditioner %>/Node.js',
                '<%= path.conditioner %>/ModuleBase.js',
                '<%= path.conditioner %>/Conditioner.js'
            ],
            options:{
                specs:'<%= path.spec %>/*.js',
                vendor:'<%= path.spec %>/lib/require.js',
                helpers:[
                    '<%= path.spec %>/lib/main.js',
                    '<%= path.spec %>/shim/Function.bind.js'
                ]
            }
        },
        concat:{
            dist:{
                options: {
                    banner:'<%= meta.banner %>',

                    process:function(src,path){

                        if (path.indexOf('wrapper/') === -1) {

                            src = '    ' + src;

                            // add tabs
                            src = src.replace(/(\n)+/g,function(match) {
                                return match + '    ';
                            });

                        }
                        return src;
                    }

                },
                src:[
                    '<%= path.wrapper %>/intro.js',

                    '<%= path.conditioner %>/Utils.js',
                    '<%= path.conditioner %>/Observer.js',

                    '<%= path.conditioner %>/ExpressionBase.js',
                    '<%= path.conditioner %>/UnaryExpression.js',
                    '<%= path.conditioner %>/BinaryExpression.js',
                    '<%= path.conditioner %>/ExpressionFormatter.js',

                    '<%= path.conditioner %>/TestBase.js',
                    '<%= path.conditioner %>/TestFactory.js',
                    '<%= path.conditioner %>/Tester.js',

                    '<%= path.conditioner %>/ModuleBase.js',
                    '<%= path.conditioner %>/ModuleRegister.js',
                    '<%= path.conditioner %>/ConditionsManager.js',
                    '<%= path.conditioner %>/ModuleController.js',
                    '<%= path.conditioner %>/Node.js',
                    '<%= path.conditioner %>/Conditioner.js',

                    '<%= path.wrapper %>/outro.js'
                ],
                dest:'dist/<%= pkg.name %>-<%= pkg.version %>.js'
            }
        },
        copy: {
            tests: {
                expand:true,
                cwd: '<%= path.tests %>',
                src:'*',
                dest:'dist/tests/'
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
                dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.min.js'
            }
        },
        jshint:{
            options:{
                jshintrc:'.jshintrc'
            },
            all:[
                '<%=concat.dist.dest %>',
                '<%=path.src %>/tests/*.js'
            ]
        },
        watch: {
            files:['<%= path.src %>/**/*.js','<%= path.spec %>/*.js'],
            tasks:'test'
        }

    });


    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');



    // test
    grunt.registerTask('test',['jshint','jasmine']);

    // task for building the library
    grunt.registerTask('lib',['concat','copy','uglify']);

    // build everything
    grunt.registerTask('default',['lib','test']);

};