const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const $ = gulpLoadPlugins();

var paths = {
    html: ['./example/*.html'],
    js: ['./src/js/*.js'],
    css: ['./src/css/**.css'],
    less: ['./src/css/**/*.less']
};

gulp.task('less', () => {
    return gulp.src(paths.less)
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.less())
        .pipe($.rename({suffix: '.min'}))
        .pipe($.sourcemaps.write('.'))
        .pipe($.connect.reload())
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('js', function () {
    return gulp.src(paths.js)
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['babel-preset-es2015']
        }))
        .pipe($.rename({suffix: '.min'}))
        .pipe($.uglify())
        .pipe($.connect.reload())
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/js'))
});

gulp.task('html', function () {
    return gulp.src(paths.html)
        .pipe($.connect.reload());
});

gulp.task('connect', function () {
    $.connect.server({
        root: './',
        port: 9998,
        host: 'localhost',
        livereload: true
    });
});

gulp.task('watch', function () {
    gulp.watch(paths.less, ['less']);
    gulp.watch(paths.js, ['js']);
    gulp.watch(paths.html, ['html']);
});

gulp.task('build', ['less', 'js']);
gulp.task('serve', ['connect']);
