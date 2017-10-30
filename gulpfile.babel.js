import gulp from 'gulp';
import header from 'gulp-header';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
import size from 'gulp-size';
import uglify from 'gulp-uglify';

const pkg = require('./package.json');
const banner = `/* ${ pkg.name } ${ pkg.version } */`;

gulp.task('build', () => {
  gulp.src('./src/conditioner.js')
    .pipe(babel({
      plugins: [
        'syntax-dynamic-import',
        'transform-es2015-modules-umd'
      ],
      presets: [
        'es2015'
      ]
    }))
    //.pipe( uglify() )
    .pipe( header(banner, { pkg }) )
    .pipe( rename(`${ pkg.name }.js`) )
    .pipe( size({ gzip: true }) )
    .pipe( gulp.dest('./dist') );
});

gulp.task('default', ['build'], () => {
	gulp.watch('./src/conditioner.js', ['build']);
});