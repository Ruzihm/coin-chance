var http = require('http');
var https = require('https');

var Auth = require('./rpcauth');

//TODO Fix some of default boalean values ...

/* Rpc Server Object
 *
 * new Server (options)
 *  - options: json options object
 *
 *  Define: json options object: {
 *    ssl: json ssl object, default null
 *    auth: json auth object, default null
 *
 *    port: int port of rpc server, default 5080 for http or 5433 for https
 *    host: string domain name or ip of rpc server, default '127.0.0.1'
 *    queue: int listner pending connection pool size, default 512
 *    strict: boolean false to turn rpc checks off, default true
 *
 *    Define: 'json ssl object': {
 *      ca: array of string with ca's to use, default null
 *      key: string with the private key to use, default null
 *      pfx: string with the key, cert and ca info in PFX format, default null
 *      cert: string with the public x509 certificate to use, default null
 *      strict: boolean false to disable remote cert verification, default true
 *      passphrase: string passphrase to be used to acces key or pfx, default null
 *
 *      protocol: string ssl protocol to use, default 'SSLv3_server_method'
 *      clientCert: boolean true to request client certificate, default false
 *      handshakeTimeout: int handshake timeout in milliseconds, default 60
 *
 *      sniName: string name for Server Name Indication, default 'RPC-Server'
 *      sniCallback: function (servername) -> SecureContext, default Node.js Callback
 *
 *     - note# Before changing options down belowe make sure you are aware of BEAST Attacks in ssl.
 *     - ref# http://blog.ivanristic.com/2011/10/mitigating-the-beast-attack-on-tls.html
 *      ciphers: string ciphers to use or exlude, default 'AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH'
 *      ciphersOrder: boolean false to use client for cipher selection, default true
 *    }
 *
 *    Define: 'json auth object': {
 *     - note# see rpcauth.js for nested json objects.
 *
 *      body: string body for 401, dafault "<h1>401 Auth Required!</h1>"
 *      message: string realm name for 401, default "Rpc Authentication"
 *  
 *      ext: json ext object width functions that extend authentecation, default null
 *      auth: object.check (obj req, obj res, function (req, res, user)), default null
 *      users: array [] = json user object (only used if ext.users is null), default []
 *    }
 *  }
 */
var Server = function (options) {
  var self = this;
  var serv = null;
  options = options || {};

  var conf = {
    functions: {},

    host: options.host || '127.0.0.1',
    queue: options.queue || 512,

    hash: options.hash || null,
    login: options.login || null,
  };

  if (options.strict !== null)
    conf.strict = options.strict;
  else
    conf.strict = true;

  /* Note: We store server config for server restart functions,
   *  these functions are missing but planned. */
  if (options.ssl) {
    conf.ssl = {
      sniName: options.ssl.sniName || 'RPC-Server',
      protocol: options.ssl.protocol || 'SSLv3_server_method',
      
      clientCert: options.ssl.clientCert || false,
      handshakeTimeout: options.ssl.handshakeTimeout || 60,

      ciphers: options.ssl.ciphers || 'AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH',
    };
    
    if (options.ssl.clientCert !== null)
      conf.ssl.clientCert = options.ssl.clientCert;
    else
      conf.ssl.clientCert = false;

    if (options.ssl.ciphersOrder !== null)
      conf.ssl.ciphersOrder = options.ssl.ciphersOrder;
    else
      conf.ssl.ciphersOrder = true;

    if (options.ssl.pfx) {
      conf.ssl.pfx = options.ssl.pfx;
      if (options.ssl.strict !== null)
        conf.ssl.strict = options.ssl.strict;
      else
        conf.ssl.strict = true;
    }
    else if (options.ssl.key && options.ssl.cert) {
      if (options.ssl.ca) {
        conf.ssl.ca = options.ssl.ca;
        if (options.ssl.strict !== null)
          conf.ssl.strict = options.ssl.strict;
        else
          conf.ssl.strict = true;
      }

      conf.ssl.key = options.ssl.key;
      conf.ssl.cert = options.ssl.certs;
    }
    // TODO Else -> tls will trow error and crash server
    // - see semi fix: try/catch in this.start

    if (options.ssl.sniCallback)
      conf.ssl.sniCallback = options.ssl.sniCallback;
    if (options.ssl.passphrase)
      conf.ssl.passphrase = options.ssl.passphrase;
  }

  if (options.auth) {
    if (options.auth.auth)
      conf.auth = options.auth.auth;
    else
      conf.auth = new Auth(options.auth);
  }

  /* Private: Return result object */
  var setReply = function (result, error, id) {
    if (result || error) {
      var out = {};

      if (conf.strict) {
        out.id = null, 
        out.jsonrpc = "2.0"
      }

      if (id)
        out.id = id;

      if (error)
        out.error = error;
      else if (result)
        out.result = result;

      return out;
    }
    else return null;
  };

  var callHandler = function (res, requests) {
    if(requests.length > res.rpc.idx) {
      var error = null;

      var r = requests[res.rpc.idx];
      res.rpc.idx++;

      // TODO Chenge this around a bit ...
      // Make it a extra sanity/security  check by
      //  - making the r.jsonrpc value flexible.
      //  - and not sending it back the value on bad request.
      if (conf.strict && (r.jsonrpc !== '2.0' || !r.id))
        error = { code: -32600, message: "Invalid Request" };
      else if (typeof r.method === 'string')
        if (typeof conf.functions[r.method] === 'function')
          conf.functions[r.method](r.params, function (err, ret) {
            var reply = setReply(ret, err, r.id);
            if (reply) res.rpc.batch.push(reply);
            callHandler(res, requests);
          });
        else
          error = { code: -32601, message: "Method not found" };
      else
        error = { code: -32600, message: "Invalid Request" };

      if(error) {
        res.rpc.batch.push(setReply(null, error, r.id));
        callHandler (res, requests);
      }
    }
    else {
      if (res.rpc.batch.length > 0)
        if(res.rpc.isBatch)
          res.end(JSON.stringify(res.rpc.batch));
        else
          res.end(JSON.stringify(res.rpc.batch[0]));
      else
        res.end();
    }
  };

  /* Private: Validate request data */
  var dataHandler = function (res, data) {
      var reply = {};
      var request = null;

      res.rpc = {
        idx: 0,      
        batch: [],
        isBatch: false
      };

      try {
        requests = JSON.parse(data);
      }
      catch (err) {
        reply = setReply(null, { code: -32700, message: "Parse error" });
        res.end(JSON.stringify(reply));
        return;
      }

      if (!Array.isArray(requests))
        requests = [requests];

      if (requests.length > 1)
        res.rpc.isBatch = true;
      else 
        res.rpc.isBatch = false;

      if (requests.length > 0) {
        callHandler (res, requests);
      }
      else {
        reply = setReply(null, { code: -32600, message: "Invalid Request" });
        res.end(JSON.stringify(reply));
        return;
      }
      
  };

  /* Private: Validate incomming request */
  var requestHandler = function (req, res) {
    if (conf.auth) {
      conf.auth.check (req, res, function (req, res, user) {
        var data = '';
        req.on('data', function (bytes) {
          data += bytes;
        });

        req.on('end', function () {
          res.user = user;
          dataHandler(res, data);
        });
      });
    }
    else {
      var data = '';
      req.on('data', function (bytes) {
        data += bytes;
      });

      req.on('end', function () {
        dataHandler(res, data);
      });
    }
  };

  if (conf.ssl) {
    var opts = {
      servername: conf.sniName || 'RPC-Server',
      requestCert: conf.ssl.clientCert || false,
      secureProtocol: conf.ssl.protocol || 'SSLv3_server_method',
      handshakeTimeout: conf.ssl.handshakeTimeout || 60,

      ciphers: conf.ssl.ciphers || 'AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH',
      honorCipherOrder: conf.ssl.ciphersOrder || true
    };

    if (conf.ssl.pfx) {
      opts.pfx = conf.ssl.pfx;
      opts.rejectUnauthorized = conf.ssl.strict || true;
    }
    else {
      if (conf.ssl.ca) {
        opts.ca = conf.ssl.ca;
        opts.rejectUnauthorized = conf.ssl.strict || true;
      }
      if (conf.ssl.key && conf.ssl.cert) {
        opts.key = conf.ssl.key;
        opts.cert = conf.ssl.cert;
      }
    }
    if (conf.ssl.sniCallback)
      opts.SNICallback = conf.ssl.sniCallback;
    if (conf.ssl.passphrase)
      opts.passphrase = conf.ssl.passphrase;

    try {  
      conf.port = options.port || 5433;
      serv = https.createServer(opts, requestHandler);
    }
    catch (error) {
      //TODO Deal with http, ssl create error
      console.error(error);
    }
  }
  else {
    try {  
      conf.port = options.port || 5080;
      serv = http.createServer(requestHandler);
    }
    catch (error) {
      //TODO Deal with http create error
      console.error(error);
    }
  }

  serv.on('error', function (error) {
    //TODO Proccess Request Error
    console.error(error);
  });

  this.addMethod = function (name, func) {
    if (name && typeof func === 'function')
      conf.functions[name] = func;
  };

  this.delMethod = function (name) {
    if (conf.functions[name])
      conf.functions[name] = null;
  };

  this.start = function (callback) {
    try {
      serv.listen(conf.port, conf.host, conf.queue, callback);
    }
    catch (error) {
      callback(error);
    }
  };

  this.stop = function (callback) {
    try {
      serv.close(callback);
    }
    catch (error) {
      callback(error);
    }
  };

  options = null;
};

module.exports = Server;