import gulp from 'gulp';
import header from 'gulp-header';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
import size from 'gulp-size';
import uglify from 'gulp-uglify';
import preprocess from 'gulp-preprocess';
import pkg from './package.json';

const banner = `/* ${pkg.name} ${pkg.version} */\n`;

gulp.task('build-browser', () =>
	gulp
		.src('./index.js')
		.pipe(rename('conditioner.js'))
		.pipe(
			babel({
				plugins: ['syntax-dynamic-import', 'transform-es2015-modules-umd'],
				presets: [
					[
						'env',
						{
							targets: {
								browsers: ['last 2 versions']
							}
						}
					]
				]
			})
		)
		.pipe(rename(`${pkg.name}.js`))
		.pipe(header(banner))
		.pipe(gulp.dest('./'))
		.pipe(preprocess())
		.pipe(uglify())
		.pipe(rename(`${pkg.name}.min.js`))
		.pipe(header(banner))
		.pipe(size({ gzip: true }))
		.pipe(gulp.dest('./'))
);

gulp.task('build-esm', () =>
	gulp
		.src('./index.js')
		.pipe(header(banner))
		.pipe(rename(`${pkg.name}.esm.js`))
		.pipe(size({ gzip: true }))
		.pipe(gulp.dest('./'))
);

gulp.task('build', ['build-browser', 'build-esm']);

gulp.task('default', ['build'], () => {
	gulp.watch('index.js', ['build']);
});
