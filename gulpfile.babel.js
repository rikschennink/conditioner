import gulp from 'gulp';
import header from 'gulp-header';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
import size from 'gulp-size';
import uglify from 'gulp-uglify';
import pkg from './package.json';

gulp.task('umd', () => gulp.src('./index.js')
.pipe( rename('conditioner.js') )
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
  .pipe( header(`/* ${ pkg.name } ${ pkg.version } */`) )
  .pipe( rename(`${ pkg.name }.js`) )
  .pipe( size({ gzip: true }) )
  .pipe( gulp.dest('./umd') )
);

gulp.task('dev', ['umd'], () => {
	gulp.watch('./index.js', ['umd']);
});