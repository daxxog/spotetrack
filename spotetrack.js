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
        FlacTrack,
        MongoTrack,
        Wrapper,
        mongo = require('mongodb'),
        Grid = require('gridfs-stream'),
        redis = require('redis'),
        Readable = require('stream').Readable,
        Transform = require('stream').Transform,
        inherits = require('util').inherits,
        spawn = require('child_process').spawn,
        endian = require('os').endianness().replace('LE', 'little').replace('BE', 'big');

    Spotetrack = function(rlist, uri) {
        this.clients = [
            redis.createClient(6379, '127.0.0.1', { //binary data client
                return_buffers: true,
                auth_pass: null
            }),
            redis.createClient(),
            redis.createClient(),
            redis.createClient()
        ];
        this.rlist = (typeof rlist == 'string') ? rlist : 'spotedis';
        this.uri = uri;

        this.connect();
        Readable.call(this);
    }; inherits(Spotetrack, Readable);

    Spotetrack.prototype.connect = function() {
        var that = this;

        this.clients[0].on('message', function(chan, data) {
            that.push(data);
        });
        this.clients[0].subscribe(this.uri+':data');

        this.clients[1].on('message', function(chan, data) {
            data = data.split('_').map(function(v) {
                return parseInt(v, 10);
            });

            that.sample_rate = data[0];
            that.channels = data[1];
            that.num_frames = data[2];
            that.frames_size = data[3];

            that.emit('format');
        });
        this.clients[1].subscribe(this.uri+':format');

        this.clients[2].on('message', function() {
            that.push(null);
            that.clients[0].quit();
            that.clients[1].quit();
            that.clients[2].quit();
        });
        this.clients[2].subscribe(this.uri+':end');

        this.clients[3].rpush(this.rlist, this.uri, function() {
            that.clients[3].quit();
        });
    };

    Spotetrack.prototype._read = function() {};

    FlacTrack = function(rlist, uri) {
        var track = new Spotetrack(rlist, uri),
            that = this;

        track.on('format', function() {
            that.flac = spawn('flac', ['-', '--best', '--endian='+endian, '--bps=16', '--sign=signed', '--channels='+track.channels, '--sample-rate='+track.sample_rate, '-s', '-c']);
            console.log(uri, 'fmt', endian, track.channels,track.sample_rate);
            track.pipe(that.flac.stdin);
            that.flac.stdout.pipe(that);
        });

        Transform.call(this);
    }; inherits(FlacTrack, Transform);

    FlacTrack.prototype._transform = function(data, encoding, cb) {
        cb(null, data);
    };

    MongoTrack = function(rlist, uri, db) {
        var that = this;

        that.gfs = Grid(db, mongo);
        that.gfs.exist({
            filename: uri
        }, function(err, found) {
            if(found) {
                console.log(uri, 'found in db');
                that.gfs.createReadStream({
                    filename: uri
                }).pipe(that);
            } else {
                that.flac = new FlacTrack(rlist, uri);
                that.gf = that.gfs.createWriteStream({
                    filename: uri
                });

                that.flac.pipe(that);
                that.flac.pipe(that.gf);
            }
        });

        Transform.call(this);
    }; inherits(MongoTrack, Transform);

    MongoTrack.prototype._transform = function(data, encoding, cb) {
        cb(null, data);
    };

    Wrapper = function(rlist, cb) {
        this.rlist = rlist;

        mongo.MongoClient.connect('mongodb://127.0.0.1:27017/' + rlist, function(err, db) {
            cb(function(uri) {
                return new MongoTrack(rlist, uri, db);
            }, db);
        });
    };

    return Wrapper;
}));
