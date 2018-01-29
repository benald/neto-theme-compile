# neto-theme-compile
![Gulp example](doc/gulp.png)

## Usage

### `npm install neto-theme-compile`

### Gulp
In your `gulpfile.js`, simply import and call the `gulpWatchAndCompile()` method like so:
```javascript
var gulp = require('gulp');
var { gulpWatchAndCompile } = require('./index');

gulp.task('default', function() {
    return gulpWatchAndCompile();
});
```

### API
You can also use the library programmatically, as seen below:
```javascript
const { NetoThemeCompiler } = require('./index');
let themeCompiler;

themeCompiler = new NetoThemeCompiler();
themeCompiler.init()
    .then(() => themeCompiler.compileFull())
    .then(() => console.log('Done!'))
    .catch((err) => console.error(err))
```

### TODO
- [ ] Rename the style.css and netothemeinfo.txt correctly