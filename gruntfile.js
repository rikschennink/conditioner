module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg:grunt.file.readJSON('package.json'),
        concat:{
            build:{
                src:[
                    'src/wrapper/begin.js',

                    'src/Conditioner.js',
                    'src/BehaviorController.js',
                    'src/ConditionerManager.js',
                    'src/DepedencyRegister.js',
                    'src/TestManager.js',

                    'src/BehaviorBase.js',
                    'src/MatchesSelector.js',
                    'src/MergeObjects.js',
                    'src/Observer.js',

                    'src/wrapper/end.js'
                ],
                dest:'build/<%= pkg.name %>.min.js'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default task(s).
    grunt.registerTask('default', ['concat']);

};