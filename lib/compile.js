const git = require('simple-git/promise');
const fs = require('fs-extra');
const minimatch = require('minimatch');
const colors = require('colors');
const rimraf = require('rimraf');


class NetoThemeCompiler {
    constructor(options = {}) {
        let defaults = {
            repo: 'https://github.com/NetoECommerce/Skeletal.git',
            masterPath: './.tmp/themeMaster/',
            tmpBuildPath: './.tmp/build/',
            srcPath: './src/',
            distPath: './dist/',
            exclude: ['**/*.less'],
            silent: false
        };
        this.options = Object.assign(defaults, options);

        this.compileFileResult = Object.freeze({
            Source: 1,
            MasterSource: 2,
            Removed: 3,
            Excluded: 4
        });
    }

    init() {
        return this.cloneRepo();
    }

    cloneRepo() {
        this.log('Cloning master source from ' + `${this.options.repo}`.magenta.underline);
        return fs.emptyDir(this.options.masterPath)
            .then(() => {
                return git()
                    .silent(true)
                    .clone(this.options.repo, this.options.masterPath);
            })
            .then(() => { this.log(`Done!`); });
    }

    // Compile a full directory
    compileFull() {
        this.log(`Running full compile...`);
        return fs.pathExists(this.options.srcPath)
            .then(exists => {
                if (!exists) throw 'No src folder found in current directory';
            })
            // Empty the temp build directory
            .then(() => { return fs.emptyDir(this.options.tmpBuildPath); })
            // Copy src directory from the master build path into tmp
            .then(() => { return fs.copy(this.options.masterPath + 'src/', this.options.tmpBuildPath); })
            // Copy theme src into tmp
            .then(() => { return fs.copy(this.options.srcPath, this.options.tmpBuildPath); })
            // Remove excluded files
            .then(() => {
                let exclusions = [];
                for (let pattern of this.options.exclude) {
                    exclusions.push(new Promise((resolve, reject) => {
                        rimraf(this.options.tmpBuildPath + pattern, (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    }));
                }
                return Promise.all(exclusions);
            })
            // Empty dist directory
            .then(() => { return fs.emptyDir(this.options.distPath); })
            // Copy tmp build to dist directory
            .then(() => { return fs.copy(this.options.tmpBuildPath, this.options.distPath); })
            .then(() => { this.log(`Done!`); })
    }

    // Compile a single file at once
    compileFile(relative) {

        // Exclude any files that match an exclude glob
        let excludeFile = false;
        for (let pattern of this.options.exclude) {
            if (minimatch(relative, pattern)) {
                excludeFile = true;
                break;
            }
        }
        if (excludeFile) {
            this.log('File excluded from build: ' + `${relative}`.magenta);
            return new Promise(resolve => resolve(this.compileFileResult.Excluded));
        }

        // Copy file from src if it exists
        return fs.copy(this.options.srcPath + relative, this.options.distPath + relative)
            .then(() => {
                this.log('File compiled from source: ' + `${relative}`.magenta);
                return this.compileFileResult.Source;
            })
            .catch(err => {
                if (err.code !== 'ENOENT') throw err;

                // File doesn't exist in src, try and copy from repo
                return fs.copy(this.options.masterPath + 'src/' + relative, this.options.distPath +
                        relative)
                    .then(() => {
                        this.log('File compiled from master source: ' + `${relative}`.magenta);
                        return this.compileFileResult.MasterSource;
                    })
                    .catch(err => {
                        if (err.code !== 'ENOENT') throw err;

                        // File doesn't exist in repo, remove file from dist
                        return fs.remove(this.options.distPath + relative)
                            .then(() => {
                                this.log('File removed: ' + `${relative}`.magenta);
                                return this.compileFileResult.Removed;
                            })
                    })
            });
    }

    log(message) {
        if (!this.silent) console.log(`[` + 'neto-theme-compile'.cyan + `] ${message}`);
    }

}

module.exports.NetoThemeCompiler = NetoThemeCompiler;