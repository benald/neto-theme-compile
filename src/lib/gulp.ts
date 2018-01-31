import { INetoThemeCompilerOptions, NetoThemeCompiler } from "../index";
import watch = require("gulp-watch");

// @types/gulp-watch doesn't export the IWatchStream interface, so we must redefint it here :(
export interface IWatchStream extends NodeJS.ReadWriteStream {
    add(path: string | string[] ): NodeJS.ReadWriteStream;
    unwatch(path: string | string[] ): NodeJS.ReadWriteStream;
    close(): NodeJS.ReadWriteStream;
}

let themeCompiler: NetoThemeCompiler;

export function watchAndCompile(options: INetoThemeCompilerOptions): Promise < void | IWatchStream > {
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
