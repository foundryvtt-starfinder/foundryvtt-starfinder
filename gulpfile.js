
const gulp = require('gulp');
const less = require('gulp-less');

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

exports.default = gulp.series(css, watchUpdates);
exports.css = css;
