/**
 * Gulp modules
 */
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var header = require('gulp-header');
var mocha = require('gulp-mocha-phantomjs');
var size = require('gulp-size');
var jshint = require('gulp-jshint');
var reporter = require('jshint-stylish');
var wrap = require('gulp-wrap');
var beautify = require('gulp-beautify');
var replace = require('gulp-replace');

/**
 * Package data
 */
var pkg = require('./package.json');

/**
 * Helpers
 */
var banner = '// <%= pkg.name %> v<%= pkg.version %> - <%= pkg.description %>\n' +
             '// Copyright (c) 2014 <%= pkg.author.name %> - <%= pkg.homepage %>\n' +
             '// License: <%= pkg.licenses[0].type %> - <%= pkg.licenses[0].url %>\n';

var beauty = {
    indentSize:4,
    indentChar:'\t'
};

var paths = {
    src:'./src/',
    spec:'./spec/',
    dist:{
        dev:'./dist/dev/',
        prod:'./dist/min/',
        spec:'./spec/lib/'
    }
};

var files = {
    lib:[
        './src/lib/UnaryExpression.js',
        './src/lib/BinaryExpression.js',
        './src/lib/ExpressionFormatter.js',
        './src/lib/TestFactory.js',
        './src/lib/Tester.js',
        './src/lib/ModuleRegistry.js',
        './src/lib/ModuleController.js',
        './src/lib/NodeController.js',
        './src/lib/SyncedControllerGroup.js',
        './src/lib/StaticModuleAgent.js',
        './src/lib/ConditionModuleAgent.js',
        './src/lib/ModuleLoader.js'
    ]
};

/**
 * 'Private' tasks
 */
var copySupportFilesInFolder = function(folder) {
    return gulp
        .src(paths.src + folder + '*')
        .pipe(beautify(beauty))
        .pipe(gulp.dest(paths.dist.dev + folder))
        .pipe(gulp.dest(paths.dist.spec + folder))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist.prod + folder))
};

gulp.task('_lib',function(){

    return gulp
        .src(files.lib)
        .pipe(concat(pkg.name + '.js'))
        .pipe(wrap({ src: paths.src + 'factory.js'}))
        .pipe(replace('// FACTORY ',''))
        .pipe(header(banner,{pkg:pkg}))
        .pipe(beautify(beauty))
        .pipe(gulp.dest(paths.dist.dev))
        .pipe(gulp.dest(paths.dist.spec))
        .pipe(uglify())
        .pipe(size())
        .pipe(gulp.dest(paths.dist.prod));

});

gulp.task('_utils',function(){
    return copySupportFilesInFolder('utils/');
});

gulp.task('_plugins',function() {
    return copySupportFilesInFolder('tests/');
});


/**
 * 'Public' tasks
 */
gulp.task('test',['build'],function(){

    // do mocha tests, but wait for build
    return gulp
        .src(paths.spec + 'runner.html')
        .pipe(mocha({reporter:'spec'}));

});

gulp.task('build',['_lib','_utils','_plugins'],function() {

    // hint build results, but wait for lib to build
    return gulp
        .src(paths.dist.dev + pkg.name + '.js')
        .pipe(jshint())
        .pipe(jshint.reporter(reporter));

});

gulp.task('dev',['test'],function() {

    // watch but first test current
    gulp.watch([paths.src + '**/*',paths.spec + '*.js'],['test']);

});