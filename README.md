# neto-theme-compile

## Usage
### CLI

### API
```javascript
const { ThemeCompiler } = require('./compile');
let themeCompiler;

themeCompiler = new ThemeCompiler();
themeCompiler.init()
    .then(() => themeCompiler.compileFull())
    .then(() => console.log('Done!'))
    .catch((err) => console.error(err))
```

### GULP
```javascript
var gulp = require('gulp');
var { gulpWatchAndCompile } = require('./index');


gulp.task('default', function() {
    return gulpWatchAndCompile();
});
```