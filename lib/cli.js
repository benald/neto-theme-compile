#!/usr/bin/env node

const program = require('commander');
const package = require('../package.json');
const { NetoThemeCompiler } = require('../lib/compile');


const repo = 'https://github.com/NetoECommerce/Skeletal.git';
const repoDir = './.tmp/buildSource';
const srcDir = './src';
const distDir = './dist';

program
    .version(package.version)
    .option('-b, --srcDir [dir]', 'override the source directory', srcDir)
    .option('-c, --distDir [dir]',
        'override the dist directory. CAUTION this directory will be deleted each time the theme is compiled',
        distDir)
    .option('-f, -- [url]', 'override the build source repo', repo)
    .parse(process.argv);


// let options;
// if (program.srcDir) options.srcDir

// const compiler = new ThemeCompiler()

// console.log(program);
// if (program.peppers) console.log('  - peppers');
// if (program.pineapple) console.log('  - pineapple');
// if (program.bbqSauce) console.log('  - bbq');
// console.log('  - %s cheese', program.cheese);