# Json-rpc

Flexible client, server objects for json-rpc communications between node.js servers with support for https.

### Install

```bash
  $ npm install node-json-rpc
```

### Info

Node-json-rpc is designed to be compatible with specs defined at [jsonrpc.org](http://www.jsonrpc.org). To add flexibility we added the option to run the apps in strict mode or to turn it off. When not using strict mode allot of the bloat in the spec can be removed and more flexibility can be achieved.

To get started have a look at the minimal example down below or the more complete example in the test directory.

#### Server Setup

For all posible options please read the notes in ./lib/rpcserver.js or look at test files to see a example.

```javascript
var rpc = require('node-json-rpc');

var options = {
  // int port of rpc server, default 5080 for http or 5433 for https
  port: 5080,
  // string domain name or ip of rpc server, default '127.0.0.1'
  host: '127.0.0.1',
  // string with default path, default '/'
  path: '/',
  // boolean false to turn rpc checks off, default true
  strict: true
};

// Create a server object with options
var serv = new rpc.Server(options);

// Add your methods
serv.addMethod('myMethod', function (para, callback) {
  var error, result;
  
  // Add 2 or more parameters together
  if (para.length === 2) {
    result = para[0] + para[1];
  } else if (para.length > 2) {
    result = 0;
    para.forEach(function (v, i) {
      result += v;
    });
  } else {
    error = { code: -32602, message: "Invalid params" };
  }

  callback(error, result);
});

// Start the server
serv.start(function (error) {
  // Did server start succeed ?
  if (error) throw error;
  else console.log('Server running ...');
});
```

#### Client Setup

For all posible options please read the notes in ./lib/rpcclient.js or look at test files to see a example.

```javascript
var rpc = require('node-json-rpc');

var options = {
  // int port of rpc server, default 5080 for http or 5433 for https
  port: 5080,
  // string domain name or ip of rpc server, default '127.0.0.1'
  host: '127.0.0.1',
  // string with default path, default '/'
  path: '/',
  // boolean false to turn rpc checks off, default true
  strict: true
};

// Create a server object with options
var client = new rpc.Client(options);

client.call(
  {"jsonrpc": "2.0", "method": "myMethod", "params": [1,2], "id": 0},
  function (err, res) {
    // Did it all work ?
    if (err) { console.log(err); }
    else { console.log(res); }
  }
);

client.call(
  {"method": "myMethod", "params": [1,2]},
  function (err, res) {
    // Did it all work ?
    if (err) { console.log(err); }
    else { console.log(res); }
  }
);
```

# License

Copyright (c) 2013, Koen Van Rulo (@NemoPersona) All rights reserved.  
This product is free and open-source software released under the BSD license.