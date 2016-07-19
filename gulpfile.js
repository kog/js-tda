'use strict';

const gulp = require('gulp');
const eventStream = require('event-stream');
const clean = require('gulp-clean');
const copy = require('gulp-copy');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const uglifyCss = require('gulp-uglifycss');
const rename = require('gulp-rename');
const wrap = require('gulp-wrap');
const header = require('gulp-header');
const order = require('gulp-order');
const flatten = require('gulp-flatten');
const replace = require('gulp-replace');
const tar = require('gulp-tar');
const gzip = require('gulp-gzip');
const bower = require('gulp-main-bower-files');
const gutil = require('gulp-util');

const pkg = require('./package.json');

const banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' * Please note that this file will contain concatenated and/or minified libraries from other authors.',
    ' */',
    ''].join('\n');

const git_repo = gutil.env.TRAVIS_REPO_SLUG || 'localhost/build';
const git_hash = gutil.env.TRAVIS_COMMIT != undefined ? gutil.env.TRAVIS_COMMIT.substring(0, 8) : '[no hash]';
const git_tag = gutil.env.TRAVIS_TAG || 'v0.0.0';

gulp.task('clean', function () {
    return gulp
        .src(['./dist', './build'], {read: false})
        .pipe(clean({force: true}));
});

gulp.task('bower', ['clean'], function () {
    return eventStream.merge(
        gulp.src('./bower.json')
            .pipe(bower('**/*.js'))
            .pipe(concat('libs.js'))
            .pipe(gulp.dest('./build')),
        gulp.src('./bower.json')
            .pipe(bower('**/*.css'))
            .pipe(concat('libs.css'))
            .pipe(gulp.dest('./build')),
        gulp.src('./bower.json')
            .pipe(bower('**/*.{eot,svg,ttf,woff,woff2}'))
            .pipe(flatten())
            .pipe(gulp.dest('./dist/debug/fonts'))
            .pipe(gulp.dest('./dist/release/fonts'))
    );
});

gulp.task('minify-js', ['bower'], function () {
    return gulp
        .src(['./build/libs.js', './assets/js/**/*.js'])
        .pipe(order(['libs.js', 'js']))
        .pipe(concat('js-tda.js'))
        .pipe(wrap('(function(){<%= contents %>}).call(this);'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/debug'))
        .pipe(uglify())
        .pipe(rename({extname: '.min.js'}))
        .pipe(gulp.dest('./dist/release'));
});

gulp.task('minify-css', ['bower'], function () {
    return gulp
        .src(['./assets/css/**/*', './build/libs.css'])
        .pipe(concat('js-tda.css'))
        .pipe(replace('../fonts', 'fonts'))
        .pipe(gulp.dest('./dist/debug'))
        .pipe(uglifyCss())
        .pipe(rename({extname: '.min.css'}))
        .pipe(gulp.dest('./dist/release'))
});

gulp.task('prepare-dists', ['minify-js', 'minify-css'], function () {
    return eventStream.merge(
        gulp.src(['index.html', './dist/fonts', './dist/js-tda.css', './dist/js-tda.js'])
            .pipe(replace('$GIT_REPO$', git_repo))
            .pipe(replace('$GIT_HASH$', git_hash))
            .pipe(replace('$GIT_TAG$', git_tag))
            .pipe(gulp.dest('./dist/debug')),
        gulp.src(['index.html', './dist/fonts', './dist/js-tda.min.css', './dist/js-tda.min.js'])
            .pipe(replace('$GIT_REPO$', git_repo))
            .pipe(replace('$GIT_HASH$', git_hash))
            .pipe(replace('$GIT_TAG$', git_tag))
            .pipe(replace('js-tda.css', 'js-tda.min.css'))
            .pipe(replace('js-tda.js', 'js-tda.min.js'))
            .pipe(gulp.dest('./dist/release'))
    );
});

gulp.task('package', ['prepare-dists'], function () {
    return eventStream.merge(
        gulp.src('dist/debug/**')
            .pipe(tar('debug.tar'))
            .pipe(gzip())
            .pipe(gulp.dest('dist')),
        gulp.src('dist/release/**')
            .pipe(tar('release.tar'))
            .pipe(gzip())
            .pipe(gulp.dest('dist'))
    );
});

gulp.task('default', ['prepare-dists']);
