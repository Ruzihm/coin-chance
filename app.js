/*
 *  Copyright 2014 Ruzihm
 *
 *  This file is part of Coin-chance.
 *
 *  Coin-chance is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Coin-chance is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Coin-chance.  If not, see <http://www.gnu.org/licenses/>.
 */

var config = require('./config'),
    express = require('express'),
    https = require('https'),
    http = require('http'),
    fs = require('fs'),
    cookie = require('cookie'),
    minify = require('express-minify'),
    connect = require('connect'),
    fstream = require('fstream'),
    zlib = require('zlib'),
    tar = require('tar'),
    http = require('http'),
    path = require('path'),
    tmp = require('tmp'),
    routes = require('./src/routes'),
    roll = require('./src/routes/roll'),
    login = require('./src/routes/login'),
    logout = require('./src/routes/logout'),
    sock = require('./src/routes/sock');

var server_options = {
    key: fs.readFileSync(config.SSLKEY),
    cert: fs.readFileSync(config.SSLCERT)
};

var socketio_options = {
    key: server_options.key,
    cert: server_options.key
};

if (config.SRC_LINK === "") {
    // delete src/public/dist/dist.tar.gz
    try {
        fs.unlinkSync('src/public/dist/dist.tar.gz');
    } catch (err) {
        // dist doesn't already exist. Not an error.
    }
    
    // compress everything in current dir and put it in a temp file
    if (false) {
        var tmpFile = tmp.file(function (err, tmpPath, fd) {
            console.info("Zipping up soure. Putting it in " + tmpPath);
            fstream.Reader({ 'path': '.', 'type': 'Directory' })
                .pipe(tar.Pack())
                .pipe(zlib.Gzip())
                //.pipe(fstream.Writer({ 'path': tmpPath }))
                .pipe(fs.createWriteStream(tmpPath))
                .on('finish', function() {
                    // Move the zip to src/public/dist/dist.tar.gz
                    console.info("Source zipped. Moving to src/public/dist/dist.tar.gz");
                    fstream.Reader({ 'path': tmpPath})
                        //.pipe(fstream.Writer({ 'path': 'src/public/dist/dist.tar.gz' }))
                        .pipe(fs.createWriteStream('src/public/dist/dist.tar.gz'))
                        .on('finish', function () {
                            startApp();
                    });
                });
        });
    } else { 
        // App disabled:
        startApp();
    }
} else {
    startApp();
}

function startApp() {
    console.info("Starting app...");
    var app = express();
    app.set('port', process.env.PORT || config.PORT);
    app.set('views', path.join(__dirname, 'src/views'));
    app.set('view engine', 'jade');
    app.use(express.compress());
    app.use(minify({js_match:/js/}));

    // all environments
    app.use(express.logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.favicon());
    app.use(express.methodOverride());
    app.use(express.cookieParser(config.COOKIE_SECRET));
    var sessionStore = new express.session.MemoryStore();
    app.use(express.session({store: sessionStore, cookie: {secure:true}}));
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'src/public')));

    // development only
    if ('development' === app.get('env')) {
        var edt = require('express-debug');
        edt(app, {});
      app.use(express.errorHandler());
    }

    app.post('/login', login.login);
    app.get('/logout', logout.logout);
    app.get('/:accountSecret?', routes.index);
    app.get('/roll/:rollId', roll.roll);

    var server = https.createServer(server_options, app).listen(config.HTTPSPORT,
            function () {
                console.log("Server listening on port " + config.HTTPSPORT);
            });
    sock.io = require('socket.io').listen(server, socketio_options);
    sock.io.set('log level', 1);
    sock.io.set('browser client minification', true);
    sock.io.set('browser client etag', true);
    sock.io.set('browser client gzip', true);

    sock.io.sockets.on('connection', sock.onconnect);
    sock.io.set('authorization', function (handshakeData, accept) {
        if (handshakeData.headers.cookie) {
            handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
            handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['connect.sid'],config.COOKIE_SECRET);
            sessionStore.get(handshakeData.sessionID, function (err, session) {
                if (err || !session) {
                    console.error("Error getting handshakeData:",err);
                } else {
                    handshakeData.session = session;
                }
            });

            if (handshakeData.cookie['express.sid'] === handshakeData.sessionID) {
                return accept('Cookie is invalid.', false);
            }
        } else {
            return accept('No cookie transmitted.', false);
        }

        accept(null, true);
    });

    // Export the app for grunt's sake
    module.exports = app;
}
