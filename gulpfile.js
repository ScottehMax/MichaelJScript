var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');

var handleError = function(task) {
  return function(err) {
    
    notify.onError({
      message: task + ' failed, check the logs..',
    })(err);
    
    gutil.log(gutil.colors.bgRed(task + ' error:'), gutil.colors.red(err));
  };
};

gulp.task('serverscripts', function() {
  return gulp.src(['app.js', 'js/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .on('error', function() {
      handleError('Server Scripts');
    });
});

gulp.task('scripts', function() {
  return gulp.src('js/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .on('error', function() {
      handleError('Client Scripts');
    });
    /*
    .pipe(concat('main.js'))
    .pipe(gulp.dest('dist/scripts'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('dist/scripts'))
    */
});

gulp.task('clean', function(cb) {
    del(['dist/assets/css', 'dist/assets/js', 'dist/assets/img'], cb)
});

gulp.task('build', function(cb) {
    gulp.start('serverscripts');
    //gulp.start('scripts');
});

gulp.task('default', ['build']);