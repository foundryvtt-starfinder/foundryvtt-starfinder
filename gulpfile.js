
const gulp = require('gulp');
const concat = require('gulp-concat');
const less = require('gulp-less');

//const STARFINDER_SCRIPTS = ["scripts/**/*.js"];

// function concatScripts() {
//     return gulp.src(STARFINDER_SCRIPTS)
//         .pipe(concat('starfinder.js'))
//         .pipe(gulp.dest('./'));
// }

//const js = gulp.series(concatScripts);

const STARFINDER_LESS = ["less/*.less"];

function compileLESS() {
    return gulp.src('less/starfinder.less')
        .pipe(less())
        .pipe(gulp.dest('./'));
}

const css = gulp.series(compileLESS);

function watchUpdates() {
    //gulp.watch(STARFINDER_SCRIPTS, js);
    gulp.watch(STARFINDER_LESS, css);
}

exports.default = gulp.series(css, watchUpdates);
//exports.js = js;
exports.css = css;
