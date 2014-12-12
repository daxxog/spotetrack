/* Spotetrack / make.js
 * echo 'make script for Spotetrack' && node make
 * (c) 2014 David (daXXog) Volm ><> + + + <><
 * Released under Apache License, Version 2.0:
 * http://www.apache.org/licenses/LICENSE-2.0.html  
 */

var bitfactory = require('bitfactory'),
    UglifyJS = require("uglify-js"),
    stoptime = require('stoptime'),
    fs = require('fs');

var watch = stoptime(),
    header = '';

bitfactory.make({ //routes
    "": function(err, results) {
        console.log('built Spotetrack in ' + watch.elapsed() + 'ms.');
    }
}, { //dependencies
    "*": { //wildcard
        "header": function(cb) {
            fs.readFile('spotetrack.h', 'utf8', function(err, data) {
                header = data;
                cb(err);
            });
        },
        "spotetrack.min.js": ["header", function(cb) {
            fs.writeFileSync('spotetrack.min.js', header + UglifyJS.minify('spotetrack.js').code);
            cb();
        }]
    }
});