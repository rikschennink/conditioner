var gulp = require('gulp');
var connect = require('gulp-connect');
var jshint = require('gulp-jshint');
var reporter = require('jshint-stylish');
var sass = require('gulp-sass');
var sequence = require('run-sequence');
var spawn = require('child_process').spawn;


gulp.task('_connect', function() {

    connect.server({
        root:'./_site',
        port:4000
    });

});

gulp.task('_rjs',function(cb){

    var ls = spawn('node_modules/requirejs/bin/r.js',['-o','./build.js']);

    ls.stdout.on('data', function (data) {
        console.log('r.js: ' + data);
    });

    ls.stderr.on('data', function (data) {
        console.log('r.js: ' + data);
    });

    ls.on('close', function (code) {
        console.log('r.js: finished ' + code);

        cb();
    });

});

gulp.task('_jekyll',function(cb){

    var ls = spawn('jekyll',['build','--config','_config-local.yml']);

    ls.stdout.on('data', function (data) {
        console.log('jekyll: ' + data);
    });

    ls.stderr.on('data', function (data) {
        console.log('jekyll: ' + data);
    });

    ls.on('close', function (code) {
        console.log('jekyll: finished ' + code);

        cb();
    });

});

gulp.task('_sass',function(){

    return gulp.src('./sass/styles.scss')
        .pipe(sass())
        .pipe(gulp.dest('./css'));

});

gulp.task('_jshint',function(){

    return gulp.src(['./js/security/*.js','./js/ui/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(reporter));


});

gulp.task('build',function(cb){

    sequence('_jshint',['_rjs','_sass'],'_jekyll',cb);

});

gulp.task('dev',['build','_connect'],function(){

    gulp.watch([
        './scss/**/*',
        './js/**/*',

        // all html files
        '**/*.html',

        // exclude these folders
        '!./_site/**/*',
        '!./node_modules/**/*'

    ],['build']);

});