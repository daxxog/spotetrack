/* Spotetrack
 * spotedis + node.js
 * (c) 2014 David (daXXog) Volm ><> + + + <><
 * Released under Apache License, Version 2.0:
 * http://www.apache.org/licenses/LICENSE-2.0.html  
 */

/* UMD LOADER: https://github.com/umdjs/umd/blob/master/returnExports.js */
(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals (root is window)
        root.Spotetrack = factory();
  }
}(this, function() {
    var Spotetrack,
        redis = require('redis'),
        EventEmitter = require('events').EventEmitter,
        inherits = require('util').inherits;

    Spotetrack = function(rlist, uri) {
        this.clients = [
            redis.createClient(),
            redis.createClient(),
            redis.createClient()
        ];
        this.rlist = (typeof rlist == 'string') ? rlist : 'spotedis';
        this.uri = uri;

        this.connect();
    }; inherits(Spotetrack, EventEmitter);

    Spotetrack.prototype.connect = function() {
        var that = this;

        this.clients[0].on('message', function(chan, data) {
            that.emit('data', new Buffer(data));
        });
        this.clients[0].subscribe(this.uri+':data');

        this.clients[2].rpush(this.rlist, this.uri, function() {
            that.clients[2].quit();
        });
    };

    return Spotetrack;
}));
