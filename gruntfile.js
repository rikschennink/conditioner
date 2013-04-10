module.exports = function(grunt) {

    grunt.initConfig({
        pkg:grunt.file.readJSON('package.json'),
        path:{
            src:'src/',
            demo:'demo/',
            conditioner:'<%= path.src %>' + 'conditioner/',
            wrapper:'<%= path.src %>' + 'wrapper/',
            tests:'<%= path.src %>' + 'tests/'
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

                    '<%= path.conditioner %>updateObject.js',
                    '<%= path.conditioner %>matchesSelector.js',
                    '<%= path.conditioner %>Observer.js',

                    '<%= path.conditioner %>Module.js',
                    '<%= path.conditioner %>Test.js',
                    '<%= path.conditioner %>TestManager.js',
                    '<%= path.conditioner %>DependencyRegister.js',
                    '<%= path.conditioner %>ConditionManager.js',
                    '<%= path.conditioner %>BehaviorController.js',
                    '<%= path.conditioner %>Conditioner.js',

                    '<%= path.wrapper %>outro.js'
                ],
                dest:'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner:'<%= meta.banner %>',
                report:'gzip'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        copy:{
            tests: {
                expand:true,
                cwd: '<%= path.tests %>',
                src:'*',
                dest:'<%= path.demo %>js/tests/'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default',['concat','uglify','copy']);

};