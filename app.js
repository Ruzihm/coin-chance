/*
 *  Copyright 2014 Rick Van Tassel<rickvt@gmail.com>
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
    assert = require('assert'),
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
    compress = require('compression'),
    morgan = require('morgan'),
    errorhandler = require('errorhandler'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    serveStatic = require('serve-static'),
    methodOverride = require('method-override'),
    routes = require('./src/routes'),
    roll = require('./src/routes/roll'),
    login = require('./src/routes/login'),
    logout = require('./src/routes/logout'),
    sock = require('./src/routes/sock');


// config sanity check
assert(config.TOTAL_WITHDRAW_FEE.gte(config.COIN_NETWORK_FEE), "config.TOTAL_WITHDRAW_FEE must be greater than or equal to config.COIN_NETWORK_FEE");
if (config.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL.gt(config.HOUSE_EDGE)) {
    console.warn("WARNING!\nconfig.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL (%s) is greater than config.HOUSE_EDGE (%s). For best results, it should be less than or equal.\nWARNING!",
            config.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL.toString(),
            config.HOUSE_EDGE.toString());
}

if (config.SSL_ENABLED) {
    var server_options = {
        key: fs.readFileSync(config.SSLKEY),
        cert: fs.readFileSync(config.SSLCERT)
    };

    var socketio_options = {
        key: server_options.key,
        cert: server_options.key
    };
}

if (config.SRC_LINK === "") {
    // delete src/public/dist/dist.tar.gz
    try {
        fs.unlinkSync('src/public/dist/dist.tar.gz');
    } catch (err) {
        // dist doesn't already exist. Not an error.
    }
    
    // compress everything in current dir and put it in a temp file
    var tmpFile = tmp.file(function (err, tmpPath, fd) {
        console.info("Starting to zip up source. Gathering it in <%s> and zipping. Please wait...", tmpPath);
        fstream.Reader({ 'path': '.', 'type': 'Directory' })
            .pipe(tar.Pack())
            .pipe(zlib.Gzip())
            //.pipe(fstream.Writer({ 'path': tmpPath }))
            .pipe(fs.createWriteStream(tmpPath))
            .on('finish', function() {
                // Move the zip to src/public/dist/dist.tar.gz
                var dest = "src/public/dist/dist.tar.gz";
                console.info("Source zipped. Moving to <%s>", dest);
                fstream.Reader({ 'path': tmpPath})
                    //.pipe(fstream.Writer({ 'path': 'src/public/dist/dist.tar.gz' }))
                    .pipe(fs.createWriteStream(dest))
                    .on('finish', function () {
                        startApp();
                });
            });
        });
} else {
    startApp();
}

function startApp() {
    console.info("Starting app...");
    var app = express();
    app.set('port', process.env.LISTENPORT || config.LISTENPORT);
    app.set('views', path.join(__dirname, 'src/views'));
    app.set('view engine', 'jade');
    app.use(compress());
    app.use(minify({js_match:/js/}));

    // all environments
    app.use(morgan('default'));
    app.use(bodyParser());
    app.use(methodOverride());
    app.use(cookieParser(config.COOKIE_SECRET));
    var sessionStore;
    var opts = {};
    for (var key in config.SESSION_STORE_OPTIONS) {
        opts[key] = config.SESSION_STORE_OPTIONS[key];
    }

    if (config.SESSION_STORE_TYPE === 'MEMORY') {
        sessionStore = new session.MemoryStore();
        console.log("MEMORY session store type configured");
    } else if (config.SESSION_STORE_TYPE === 'REDIS') {
        var RedisStore = require('connect-redis')(session);
        var redis = require('redis').createClient();
        opts.client = redis;
        sessionStore = new RedisStore(opts);
        console.log("REDIS session store type configured");
    }
    app.use(session({store: sessionStore, cookie: {secure:config.SSL_ENABLED}}));

    app.post('/login', login.login);
    app.get('/logout', logout.logout);
    app.get('/:accountSecret?', routes.index);
    app.get('/roll/:rollId', roll.roll);

    app.use(serveStatic(path.join(__dirname, 'src/public')));

    // development only
    if ('development' === app.get('env')) {
        var edt = require('express-debug');
        edt(app, {});
      app.use(errorhandler());
    }

    var server;
    if (config.SSL_ENABLED) {
        server = https.createServer(server_options, app).listen(config.LISTENPORT,
                function () {
                    console.log("Server listening on port " + config.LISTENPORT);
                });
        sock.io = require('socket.io').listen(server, socketio_options);
    } else {
        server = http.createServer(app).listen(config.LISTENPORT,
                function () {
                    console.log("Server listening on port " + config.LISTENPORT);
                });
        sock.io = require('socket.io').listen(server);
    }
    
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
