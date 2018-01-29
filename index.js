const { NetoThemeCompiler } = require('./lib/compile');
const { watchAndCompile } = require('./lib/gulp');


module.exports = {
    NetoThemeCompiler: NetoThemeCompiler,
    gulpWatchAndCompile: watchAndCompile
};