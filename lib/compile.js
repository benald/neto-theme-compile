"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const git = require("simple-git/promise");
const minimatch = require("minimatch");
const path = require("path");
const process = require("process");
const rimraf = require("rimraf");
const defaultOptions = {
    exclude: ["**/*.less"],
    logFullPath: false,
    masterRepo: "https://github.com/NetoECommerce/Skeletal.git",
    paths: {
        basePath: process.cwd(),
        distPath: "dist",
        masterPath: ".tmp/themeMaster",
        srcPath: "src",
        tmpBuildPath: ".tmp/build",
    },
    silent: false,
};
class NetoThemeCompiler {
    constructor(options = {}) {
        this.compileFileResult = Object.freeze({
            Excluded: 1,
            MasterSource: 2,
            Removed: 3,
            Source: 4,
        });
        this.options = Object.freeze(Object.assign({}, defaultOptions, options));
    }
    init() {
        return this.cloneRepo();
    }
    cloneRepo() {
        const masterPath = path.join(this.options.paths.basePath, this.options.paths.masterPath);
        // Check if master source has an src folder
        return fs.pathExists(masterPath)
            .then((exists) => {
            if (exists) {
                this.log(`Using existing master source:`, masterPath);
            }
            else {
                this.log(`Cloning master source from ${this.options.masterRepo.magenta.underline} into:`, masterPath);
                // Empty the master source dir and clone the master repo
                return fs.emptyDir(masterPath)
                    .then(() => git().silent(true).clone(this.options.masterRepo, masterPath))
                    .then(() => this.log(`Successfully cloned!`));
            }
        });
    }
    // Compile a full directory
    compileFull() {
        const masterPath = path.join(this.options.paths.basePath, this.options.paths.masterPath, "src/");
        const tmpBuildPath = path.join(this.options.paths.basePath, this.options.paths.tmpBuildPath);
        const srcPath = path.join(this.options.paths.basePath, this.options.paths.srcPath);
        const distPath = path.join(this.options.paths.basePath, this.options.paths.distPath);
        this.log(`Running full compile...`);
        return fs.pathExists(srcPath)
            .then((exists) => {
            if (!exists) {
                throw "No src folder found in current directory";
            }
        })
            .then(() => fs.emptyDir(tmpBuildPath))
            .then(() => fs.copy(masterPath, tmpBuildPath))
            .then(() => fs.copy(srcPath, tmpBuildPath))
            .then(() => {
            const exclusions = [];
            for (const pattern of this.options.exclude) {
                exclusions.push(new Promise((resolve, reject) => {
                    rimraf(path.join(tmpBuildPath, pattern), (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                }));
            }
            return Promise.all(exclusions);
        })
            .then(() => fs.emptyDir(distPath))
            .then(() => fs.move(tmpBuildPath, distPath))
            .then(() => this.log(`Successfully compiled full theme into:`, distPath));
    }
    // Compile a single file at once
    compileFile(file) {
        const masterFile = path.join(this.options.paths.basePath, this.options.paths.masterPath, "src/", file);
        const srcFile = path.join(this.options.paths.basePath, this.options.paths.srcPath, file);
        const distFile = path.join(this.options.paths.basePath, this.options.paths.distPath, file);
        // Exclude any files that match an exclude glob
        let excludeFile = false;
        for (const pattern of this.options.exclude) {
            if (minimatch(file, pattern)) {
                excludeFile = true;
                break;
            }
        }
        if (excludeFile) {
            this.log(`File excluded from build:`, srcFile);
            return new Promise((resolve) => resolve(this.compileFileResult.Excluded));
        }
        // Copy file from src if it exists
        return fs.copy(srcFile, distFile)
            .then(() => this.log(`File compiled from source:`, srcFile))
            .then(() => this.compileFileResult.Source)
            .catch((err) => {
            if (err.code !== "ENOENT") {
                throw err;
            }
            // File doesn"t exist in src, try and copy from repo
            return fs.copy(masterFile, distFile)
                .then(() => this.log(`File compiled from master source:`, srcFile))
                .then(() => this.compileFileResult.MasterSource)
                .catch((err2) => {
                if (err2.code !== "ENOENT") {
                    throw err2;
                }
                // File doesn"t exist in repo, remove file from dist
                return fs.remove(distFile)
                    .then(() => this.log(`File removed:`, srcFile))
                    .then(() => this.compileFileResult.Removed);
            });
        });
    }
    log(message, pathString = "") {
        if (this.options.silent) {
            return;
        }
        if (pathString !== "" && !this.options.logFullPath) {
            pathString = path.relative(this.options.paths.basePath, pathString);
        }
        console.log(`[${"neto-theme-compile".cyan}] ${message} ${pathString.magenta}`);
    }
}
exports.NetoThemeCompiler = NetoThemeCompiler;
module.exports.NetoThemeCompiler = NetoThemeCompiler;
