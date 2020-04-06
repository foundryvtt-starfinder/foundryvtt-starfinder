const gulp = require('gulp');
const less = require('gulp-less');
const zip = require('gulp-zip');
const del = require('del');

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

function cleanBuild() {
    return del(['build/**']);
}

function cleanDist() {
    return del(['dist/*.zip']);
}

const clean = gulp.series(cleanBuild, cleanDist);

function move() {
    return gulp.src([
        '**/*.otf',
        '**/*.ttf',
        '**/*.json',
        '**/*.js',
        '**/*.db',
        '**/*.html',
        '**/*.png',
        '**/*.jpg',
        '**/*.svg',
        'LICENSE',
        'OGL',
        'README.md',
        'starfinder.css',
        '!node_modules/**',
        '!gulpfile.js',
        '!package.json',
        '!package-lock.json',
        '!jsconfig.json'
    ]).pipe(gulp.dest('build/starfinder/'));
}

function build() {
    return gulp.src(['build/**']).pipe(zip("starfinder.zip")).pipe(gulp.dest('dist/'));
}

exports.default = gulp.series(css, watchUpdates);
exports.css = css;
exports.build = gulp.series(clean, css, move, build, cleanBuild);
exports.clean = clean;
