const git = require('simple-git/promise');
const fs = require('fs-extra');
const minimatch = require('minimatch');
const colors = require('colors');
const rimraf = require('rimraf');
const process = require('process');
const path = require('path');


class NetoThemeCompiler {
    constructor(options = {}) {
        let defaults = {
            masterRepo: 'https://github.com/NetoECommerce/Skeletal.git',
            paths: {
                basePath: './',
                masterPath: '.tmp/themeMaster',
                tmpBuildPath: '.tmp/build',
                srcPath: 'src',
                distPath: 'dist',
            },
            exclude: ['**/*.less'],
            silent: false
        };

        this.options = Object.freeze(Object.assign({}, defaults, options));

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
        let masterPath = path.join(
            this.options.paths.basePath,
            this.options.paths.masterPath
        );

        // Check if master source has an src folder
        return fs.pathExists(masterPath)
            .then(exists => {
                if (exists) {
                    this.log(`Using existing master source ${masterPath.magenta}`);
                } else {
                    this.log(`Cloning master source from ${this.options.masterRepo.magenta.underline}`);
                    // Empty the master source dir and clone the master repo
                    return fs.emptyDir(masterPath)
                        .then(() => {
                            return git()
                                .silent(true)
                                .clone(this.options.masterRepo, masterPath);
                        })
                        .then(() => { this.log(`Successfully cloned!`); });
                }
            });
    }

    // Compile a full directory
    compileFull() {
        let masterPath = path.join(
            this.options.paths.basePath,
            this.options.paths.masterPath,
            'src/'
        );
        let tmpBuildPath = path.join(
            this.options.paths.basePath,
            this.options.paths.tmpBuildPath
        );
        let srcPath = path.join(
            this.options.paths.basePath,
            this.options.paths.srcPath
        );
        let distPath = path.join(
            this.options.paths.basePath,
            this.options.paths.distPath
        );

        this.log(`Running full compile...`);
        return fs.pathExists(srcPath)
            .then(exists => {
                if (!exists) throw 'No src folder found in current directory';
            })
            // Empty the temp build directory
            .then(() => { return fs.emptyDir(tmpBuildPath); })
            // Copy src directory from the master build path into tmp
            .then(() => { return fs.copy(masterPath, tmpBuildPath); })
            // Copy theme src into tmp
            .then(() => { return fs.copy(srcPath, tmpBuildPath); })
            // Remove excluded files
            .then(() => {
                let exclusions = [];
                for (let pattern of this.options.exclude) {
                    exclusions.push(new Promise((resolve, reject) => {
                        rimraf(path.join(tmpBuildPath, pattern), (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    }));
                }
                return Promise.all(exclusions);
            })
            // Rename theme specific files
            .then(() => {
                console.log(path.basename(process.cwd()));
            })
            // Empty dist directory
            .then(() => { return fs.emptyDir(distPath); })
            // Move tmp build to dist directory
            .then(() => { return fs.move(tmpBuildPath, distPath); })
            .then(() => { this.log(`Successfully compiled full theme into ${distPath.magenta}`); })
    }

    // Compile a single file at once
    compileFile(file) {
        let masterFile = path.join(
            this.options.paths.basePath,
            this.options.paths.masterPath,
            'src/',
            file
        );
        let srcFile = path.join(
            this.options.paths.basePath,
            this.options.paths.srcPath,
            file
        );
        let distFile = path.join(
            this.options.paths.basePath,
            this.options.paths.distPath,
            file
        );

        // Exclude any files that match an exclude glob
        let excludeFile = false;
        for (let pattern of this.options.exclude) {
            if (minimatch(file, pattern)) {
                excludeFile = true;
                break;
            }
        }
        if (excludeFile) {
            this.log(`File excluded from build: ${srcFile.magenta}`);
            return new Promise(resolve => resolve(this.compileFileResult.Excluded));
        }

        // Copy file from src if it exists
        return fs.copy(srcFile, distFile)
            .then(() => {
                this.log(`File compiled from source: ${srcFile.magenta}`);
                return this.compileFileResult.Source;
            })
            .catch(err => {
                if (err.code !== 'ENOENT') throw err;

                // File doesn't exist in src, try and copy from repo
                return fs.copy(masterFile, distFile)
                    .then(() => {
                        this.log(`File compiled from master source: ${srcFile.magenta}`);
                        return this.compileFileResult.MasterSource;
                    })
                    .catch(err => {
                        if (err.code !== 'ENOENT') throw err;

                        // File doesn't exist in repo, remove file from dist
                        return fs.remove(distFile)
                            .then(() => {
                                this.log(`File removed: ${srcFile.magenta}`);
                                return this.compileFileResult.Removed;
                            });
                    });
            });
    }

    log(message) {
        if (!this.silent) console.log(`[${'neto-theme-compile'.cyan}] ${message}`);
    }

}

module.exports.NetoThemeCompiler = NetoThemeCompiler;