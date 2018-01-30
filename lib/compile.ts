import colors = require("colors");
import fs = require("fs-extra");
import git = require("simple-git/promise");
import minimatch = require("minimatch");
import path = require("path");
import process = require("process");
import rimraf = require("rimraf");

export interface INetoThemeCompilerOptions {
    exclude: string[];
    logFullPath: boolean;
    masterRepo: string;
    paths: {
        basePath: string;
        distPath: string;
        masterPath: string;
        srcPath: string;
        tmpBuildPath: string;
    };
    silent: boolean;
}

const defaultOptions: INetoThemeCompilerOptions = {
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

export class NetoThemeCompiler {
    public readonly compileFileResult = Object.freeze({
        Excluded: 1,
        MasterSource: 2,
        Removed: 3,
        Source: 4,
    });

    private options: INetoThemeCompilerOptions;

    constructor(options = {}) {
        this.options = Object.freeze(Object.assign({}, defaultOptions, options));
    }

    public init() {
        return this.cloneRepo();
    }

    private cloneRepo() {
        const masterPath = path.join(
            this.options.paths.basePath,
            this.options.paths.masterPath,
        );

        // Check if master source has an src folder
        return fs.pathExists(masterPath)
            .then((exists) => {
                if (exists) {
                    this.log(`Using existing master source:`, masterPath);
                } else {
                    this.log(
                        `Cloning master source from ${this.options.masterRepo.magenta.underline} into:`,
                        masterPath,
                    );
                    // Empty the master source dir and clone the master repo
                    return fs.emptyDir(masterPath)
                        .then(() => git().silent(true).clone(this.options.masterRepo, masterPath))
                        .then(() => this.log(`Successfully cloned!`));
                }
            });
    }

    // Compile a full directory
    public compileFull() {
        const masterPath = path.join(
            this.options.paths.basePath,
            this.options.paths.masterPath,
            "src/",
        );
        const tmpBuildPath = path.join(
            this.options.paths.basePath,
            this.options.paths.tmpBuildPath,
        );
        const srcPath = path.join(
            this.options.paths.basePath,
            this.options.paths.srcPath,
        );
        const distPath = path.join(
            this.options.paths.basePath,
            this.options.paths.distPath,
        );

        this.log(`Running full compile...`);
        return fs.pathExists(srcPath)
            .then((exists) => {
                if (!exists) { throw "No src folder found in current directory"; }
            })
            // Empty the temp build directory
            .then(() => fs.emptyDir(tmpBuildPath))
            // Copy src directory from the master build path into tmp
            .then(() => fs.copy(masterPath, tmpBuildPath))
            // Copy theme src into tmp
            .then(() => fs.copy(srcPath, tmpBuildPath))
            // Remove excluded files
            .then(() => {
                const exclusions = [];
                for (const pattern of this.options.exclude) {
                    exclusions.push(new Promise((resolve, reject) => {
                        rimraf(path.join(tmpBuildPath, pattern), (err) => {
                            if (err) { return reject(err); }
                            resolve();
                        });
                    }));
                }
                return Promise.all(exclusions);
            })
            // Rename theme specific files
            // .then(() => {
            //     let themeName = path.basename(process.cwd());
            // })
            // Empty dist directory
            .then(() => fs.emptyDir(distPath))
            // Move tmp build to dist directory
            .then(() => fs.move(tmpBuildPath, distPath))
            .then(() => this.log(`Successfully compiled full theme into:`, distPath));
    }

    // Compile a single file at once
    public compileFile(file: string) {
        const masterFile = path.join(
            this.options.paths.basePath,
            this.options.paths.masterPath,
            "src/",
            file,
        );
        const srcFile = path.join(
            this.options.paths.basePath,
            this.options.paths.srcPath,
            file,
        );
        const distFile = path.join(
            this.options.paths.basePath,
            this.options.paths.distPath,
            file,
        );

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
                if (err.code !== "ENOENT") { throw err; }

                // File doesn"t exist in src, try and copy from repo
                return fs.copy(masterFile, distFile)
                    .then(() => this.log(`File compiled from master source:`, srcFile))
                    .then(() => this.compileFileResult.MasterSource)
                    .catch((err2) => {
                        if (err2.code !== "ENOENT") { throw err2; }

                        // File doesn"t exist in repo, remove file from dist
                        return fs.remove(distFile)
                            .then(() => this.log(`File removed:`, srcFile))
                            .then(() => this.compileFileResult.Removed);
                    });
            });
    }

    private log(message: string, pathString = "") {
        if (this.options.silent) { return; }

        if (pathString !== "" && !this.options.logFullPath) {
            pathString = path.relative(this.options.paths.basePath, pathString);
        }
        console.log(`[${"neto-theme-compile".cyan}] ${message} ${pathString.magenta}`);
    }

}

module.exports.NetoThemeCompiler = NetoThemeCompiler;
