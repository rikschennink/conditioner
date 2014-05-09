
var gulp = require('gulp');
var connect = require('gulp-connect');
var jekyll = require('gulp-jekyll');
var jshint = require('gulp-jshint');
var reporter = require('jshint-stylish');
var sass = require('gulp-sass');
var spawn = require('child_process').spawn;
var sequence = require('run-sequence');


/*

"gulp": "^3.6.2",
    "gulp-connect": "^2.0.5",
    "gulp-jekyll": "0.0.0",
    "gulp-jshint": "^1.5.5",
    "gulp-requirejs": "^0.1.3",
    "gulp-sass": "^0.7.1",
    "gulp-watch": "^0.6.4"
    */



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

/*
gulp.task('_requirejs',function(){

    // javascript
    return requirejs({
        preserveLicenseComments:false,
        findNestedDependencies:true,

        // get configuration
        mainConfigFile:'./js/main.js',

        // Override base url in main.js
        baseUrl:'./js',

        // filename
        out:'main.js',

        // setup main package configuration
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

    }).pipe(gulp.dest('./js.min'));

});
*/

gulp.task('build',function(cb){

    sequence('_jshint',['_rjs','_sass'],'_jekyll',cb);

});

gulp.task('dev',['build','watch','_connect']);