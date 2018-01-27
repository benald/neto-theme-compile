const watch = require('gulp-watch');
const { NetoThemeCompiler } = require('./compile');

let themeCompiler;


module.exports.watchAndCompile = (options) => {
    return init(options)
        .then(() => {
            return watch('src/**/*', compileFile);
        })
        .catch(err => {
            console.error(err);
        })
}

function compileFile(vinylObject) {
    return themeCompiler.compileFile(vinylObject.relative)
        .catch((err) => {
            console.log(err);
        });
}
module.exports.compileFile = compileFile;

function init(options) {
    return new Promise((resolve, reject) => {
        if (!themeCompiler) {
            // First run
            themeCompiler = new NetoThemeCompiler(options);
            themeCompiler.init()
                .then(() => themeCompiler.compileFull())
                .then(resolve)
                .catch(reject)
        } else return resolve();
    });
}