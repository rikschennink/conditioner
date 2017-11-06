import gulp from 'gulp';
import header from 'gulp-header';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
import size from 'gulp-size';
import uglify from 'gulp-uglify';
import pkg from './package.json';

gulp.task('build-main', () => gulp.src('./index.js')
  .pipe( rename('conditioner.js') )
  .pipe(babel({
    plugins: [
      'syntax-dynamic-import',
      'transform-es2015-modules-umd'
    ],
    presets: [
      ['env', {
        'targets': {
          'browsers': ['last 2 versions']
        }
      }]
    ]
  }))
  .pipe( uglify() )
  .pipe( header(`/* ${ pkg.name } ${ pkg.version } */`) )
  .pipe( rename(`${ pkg.main }`) )
  .pipe( size( { gzip: true } ) )
  .pipe( gulp.dest('./') )
);