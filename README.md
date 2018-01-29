# neto-theme-compile

## Usage

### API
```javascript
const { NetoThemeCompiler } = require('./index');
let themeCompiler;

themeCompiler = new NetoThemeCompiler();
themeCompiler.init()
    .then(() => themeCompiler.compileFull())
    .then(() => console.log('Done!'))
    .catch((err) => console.error(err))
```

### GULP
In your `gulpfile.js`:
```javascript
var gulp = require('gulp');
var { gulpWatchAndCompile } = require('./index');

gulp.task('default', function() {
    return gulpWatchAndCompile();
});
```

### TODO
- [x] On full compile, don't copy excluded files
- [ ] Rename the style.css and netothemeinfo.txt correctly
- [x] Check if master source already exists instead of deleting and cloning every time