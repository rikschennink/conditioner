module.exports = function(grunt) {

	grunt.initConfig({
		pkg:grunt.file.readJSON('package.json'),
		path:{
			src:'./src',
			spec:'./spec',
            dist:'./dist',
			conditioner:'<%= path.src %>/conditioner',
			wrapper:'<%= path.src %>/wrapper',
			tests:'<%= path.src %>/tests',
			utils:'<%= path.src %>/utils'
		},
		meta:{
			banner:'// <%= pkg.name %> v<%= pkg.version %> - <%= pkg.description %>\n' +
				   '// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> - <%= pkg.homepage %>\n' +
				   '// License: <%= _.map(pkg.licenses, function(x) {return x.type + " (" + x.url + ")";}).join(", ") %>\n'
		},
        mocha:{
            test:{
                src:['./spec/runner.html'],
                options:{
                    run:false
                }
            }
        },
		concat:{
			dist:{
				options: {
					banner:'<%= meta.banner %>'
				},
				src:[
					'<%= path.wrapper %>/intro.js',

					'<%= path.conditioner %>/UnaryExpression.js',
					'<%= path.conditioner %>/BinaryExpression.js',
					'<%= path.conditioner %>/ExpressionFormatter.js',
					'<%= path.conditioner %>/TestFactory.js',
					'<%= path.conditioner %>/Tester.js',
                    '<%= path.conditioner %>/ModuleRegistry.js',
					'<%= path.conditioner %>/ModuleController.js',
					'<%= path.conditioner %>/NodeController.js',
                    '<%= path.conditioner %>/SyncedControllerGroup.js',
                    '<%= path.conditioner %>/StaticModuleAgent.js',
                    '<%= path.conditioner %>/ConditionModuleAgent.js',
					'<%= path.conditioner %>/ModuleLoader.js',

					'<%= path.wrapper %>/outro.js'
				],
				dest:'<%= path.dist %>/<%= pkg.name %>-<%= pkg.version %>.js'
			}
		},
		copy:{
			tests:{
				expand:true,
				cwd:'<%= path.tests %>',
				src:'*',
				dest:'./dist/tests/'
			},
			utils:{
				expand:true,
				cwd:'<%= path.utils %>',
				src:'*',
				dest:'./dist/utils/'
			},
            specUtils:{
                expand:true,
                cwd:'<%= copy.utils.dest %>',
                src:'*',
                dest:'./spec/lib/utils'
            },
            specTests:{
                expand:true,
                cwd:'<%= copy.tests.dest %>',
                src:'*',
                dest:'./spec/lib/tests'
            },
            specLib:{
                expand:true,
                cwd:'<%= path.dist %>/',
                src:'<%= pkg.name %>-<%= pkg.version %>.js',
                dest:'./spec/lib/'
            }
		},
		uglify:{
			tests:{
				expand:true,
				src:'*',
                cwd:'<%= copy.tests.dest %>',
				dest:'./dist/tests.min/'
			},
            utils:{
                expand:true,
                src:'*',
                cwd:'<%= copy.utils.dest %>',
                dest:'./dist/utils.min/'
            },
			lib:{
				options:{
					banner:'<%= meta.banner %>',
					report:'gzip'
				},
                files: {
                    './dist/<%= pkg.name %>-<%= pkg.version %>.min.js':['<%= concat.dist.dest %>']
                }
			}
		},
		jshint:{
			options:{
				jshintrc:'.jshintrc'
			},
			all:[
				'<%= concat.dist.dest %>',
                '<%= path.src %>/utils/*.js',
				'<%= path.src %>/tests/*.js'
			]
		},
		watch: {
			files:['<%= path.src %>/**/*.js','<%= path.spec %>/*.js'],
			tasks:'test'
		}

	});

	// load tasks
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha');

	// test
	grunt.registerTask('test',['lib','jshint','mocha']);

	// build
	grunt.registerTask('lib',['concat','copy','uglify']);

	// build than test
	grunt.registerTask('dev',['lib','test','watch']);

};