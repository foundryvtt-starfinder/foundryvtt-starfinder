
const gulp = require('gulp');
const less = require('gulp-less');
const zip = require('gulp-zip');

const STARFINDER_LESS = ["less/*.less"];

function compileLESS() {
    return gulp.src('less/starfinder.less')
        .pipe(less())
        .pipe(gulp.dest('./'));
}

const css = gulp.series(compileLESS);

function watchUpdates() {
    gulp.watch(STARFINDER_LESS, css);
}

function move() {
}

function build() {
    return gulp.src([
        '**/*.otf',
        '**/*.json',
        '**/*.js',
        '**/*.db',
        '**/*.html',
        'LICENSE',
        'OGL',
        'README.md',
        'starfinder.css',
        '!node_modules/**',
        '!gulpfile.js',
        '!package.json',
        '!package-lock.json'
    ]).pipe(zip('starfinder.zip'))
    .pipe(gulp.dest('build/'));
}

exports.default = gulp.series(css, watchUpdates);
exports.css = css;
exports.build = gulp.series(css, build);
