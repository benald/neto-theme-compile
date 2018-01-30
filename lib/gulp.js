"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const watch = require("gulp-watch");
let themeCompiler;
function watchAndCompile(options) {
    return init(options)
        .then(() => {
        return watch("src/**/*", compileFile);
    })
        .catch((err) => {
        console.error(err);
    });
}
exports.watchAndCompile = watchAndCompile;
function compileFile(vinylObject) {
    return themeCompiler.compileFile(vinylObject.relative)
        .catch((err) => {
        console.log(err);
    });
}
function init(options) {
    return new Promise((resolve, reject) => {
        if (!themeCompiler) {
            // First run
            themeCompiler = new index_1.NetoThemeCompiler(options);
            themeCompiler.init()
                .then(() => themeCompiler.compileFull())
                .then(() => resolve)
                .catch(reject);
        }
        else {
            return resolve();
        }
    });
}
