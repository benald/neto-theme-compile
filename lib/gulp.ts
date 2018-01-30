import { INetoThemeCompilerOptions, NetoThemeCompiler } from "../index";
import watch = require("gulp-watch");

let themeCompiler: NetoThemeCompiler;

export function watchAndCompile(options: INetoThemeCompilerOptions) {
    return init(options)
        .then(() => {
            return watch("src/**/*", compileFile);
        })
        .catch((err) => {
            console.error(err);
        });
}

function compileFile(vinylObject: { relative: string }) {
    return themeCompiler.compileFile(vinylObject.relative)
        .catch((err) => {
            console.log(err);
        });
}

function init(options: INetoThemeCompilerOptions) {
    return new Promise((resolve, reject) => {
        if (!themeCompiler) {
            // First run
            themeCompiler = new NetoThemeCompiler(options);
            themeCompiler.init()
                .then(() => themeCompiler.compileFull())
                .then(() => resolve)
                .catch(reject);
        } else { return resolve(); }
    });
}
