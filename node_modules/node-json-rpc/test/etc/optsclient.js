module.exports = {
  // int port of rpc server, default 5080 for http or 5433 for https
  port: 5080,
  // string domain name or ip of rpc server, default '127.0.0.1'
  host: '127.0.0.1',
  // string with default path, default '/'
  path: '/',
  // string rpc login name, default null
  login: 'user',
  // string rpc password (hash), default null
  hash: 'pass',
  // json ssl object, default null
  ssl: {
    // array of string with ca's to use, default null
    ca: null,
    // string with private key to use, default null
    key: null,
    //  string with key, cert and ca info in PFX format, default null
    pfx: null,
    // string with the public x509 certificate to use, default null
    cert: null,
    //  boolean false to disable remote cert verification, default true
    strict: false,
    // string passphrase to be used to acces key or pfx, default null
    passphrase: null,
    // string name for Server Name Indication, default 'RPC-Server'
    sniName: 'RPC-Server',
    // string ssl protocol to use, default 'SSLv3_method'
    protocol: 'SSLv3_method'
  }
};