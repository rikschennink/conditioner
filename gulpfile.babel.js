import gulp from 'gulp';
import header from 'gulp-header';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
import size from 'gulp-size';
import uglify from 'gulp-uglify';
import uglifyes from 'gulp-uglifyes';

const pkg = require('./package.json');
const banner = `/* ${ pkg.name } ${ pkg.version } */`;

gulp.task('build-es5', () => gulp.src('./src/conditioner.js')
  .pipe(babel({
    plugins: [
      'syntax-dynamic-import',
      'transform-es2015-modules-umd'
    ],
    presets: [
      'es2015'
    ]
  }))
  .pipe( uglify() )
  .pipe( header(banner, { pkg }) )
  .pipe( rename(`${ pkg.name }.js`) )
  .pipe( size({ gzip: true }) )
  .pipe( gulp.dest('./dist') )
);

gulp.task('build-es6', () => gulp.src('./src/conditioner.js')
  .pipe( uglifyes() )
  .pipe( header(banner, { pkg }) )
  .pipe( rename(`${ pkg.name }-es6.js`) )
  .pipe( size({ gzip: true }) )
  .pipe( gulp.dest('./dist') )
);

gulp.task('build', ['build-es5', 'build-es6']);

gulp.task('default', ['build'], () => {
	gulp.watch('./src/*', ['build']);
});