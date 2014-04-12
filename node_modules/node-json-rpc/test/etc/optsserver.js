module.exports = {
  // string domain name or ip of rpc server, default '127.0.0.1'
  host: '127.0.0.1',
  // int port of rpc server, default 5080 for http or 5433 for https
  port: 5080,
  // int listner pending connection pool size, default 512
  queue: 512,
  // boolean false to turn rpc checks off, default true
  strict: true,
  // json ssl object, default null
  ssl: {
    // array of string with ca's to use, default null
    ca: null,
    // string with the private key to use, default null
    key: null,
    // string with the key, cert and ca info in PFX format, default null
    pfx: null,
    // string with the public x509 certificate to use, default null
    cert: null,
    // boolean false to disable remote cert verification, default true
    strict: true,
    // string passphrase to be used to acces key or pfx, default null
    passphrase: null,
    // string ssl protocol to use, default 'SSLv3_method'
    protocol: 'SSLv3_method',
    // boolean true to request client certificate, default false
    clientCert: null,
    // int handshake timeout in milliseconds, default 60
    handshakeTimeout: 60,
    // string name for Server Name Indication, default 'RPC-Server'
    sniName: 'RPC-Server',
    // function (servername) -> SecureContext, default null
    sniCallback: null,
    // string ciphers to use or exlude, default 'AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH'
    ciphers: 'AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH',
    // boolean false to use client for cipher selection, default true
    ciphersOrder: true
  },
  // json auth object, default null
  auth: {
    // string body for 401, dafault "<h1>401 Auth Required!</h1>"
    body: '<h1>401 Auth Required!</h1>',
    // string realm name for 401, default "Rpc Authentication"
    message: 'Rpc Authentication',
    // json ext object width functions that extend authentecation, default null
    ext: null,
    // object.check (obj req, obj res, function (req, res, user)), default null
    auth: null,
    // array [] = json user object (only used if ext.users is null), default []
    users: [{ login: 'user', hash: 'pass' }]
  }
};