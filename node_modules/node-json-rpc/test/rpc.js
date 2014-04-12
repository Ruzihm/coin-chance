/* Test Client -> Server interaction */
var rpc = require('../lib/index');

var client, server;
var optsClient = require('./etc/optsclient');
var optsServer = require('./etc/optsserver');

/** 
 * Test Batch
 **/
var testBatch = function (s, c, id, debug, finaly) {
  var count = 0; var check = 0;

  var reportstat = function (valid) {
    count++;
    if (valid)
      check++;

    if (count === 17) {
      console.log('- Test ' + id + ': ' + check + '/' + count + ' passed.');
      finaly();
    }
  };

  /* Server Methode - add */
  s.addMethod('addup', function (para, callback) {
    var error, result;

    if(para.length === 2)
      result = para[0] + para[1];
    else if(para.length > 2) {
      result = 0;
      para.forEach(function (v, i) {
        result += v;
      });
    }
    else
      error = { code: -32602, message: "Invalid params" };

    callback(error, result);
  });

  /* Server Methode - subtract */
  s.addMethod('subtract', function (para, callback) {
    var error, result;

    if(para.length === 2)
      result = para[0] - para[1];
    else if(para.minuend && para.subtrahend)
      result = para.minuend - para.subtrahend;
    else
      error = { code: -32602, message: "Invalid params" };

    callback(error, result);
  });

  /* Server Methode - notify */
  s.addMethod('notify', function (para, callback) {
    var error, result;
    callback(error, result);
  });

  /* Client - Test alpha
   *  Method does not exist
   * - result null
   */
  c.call({"jsonrpc": "2.0", "method": "foobar", "id": "alpha"}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test alpha; method does not exist)');

    if (res) {
      if (res.id !== "alpha")
        valid = false;
      if (res.error) {
        if (res.error.code !== -32601)
          valid = false;
      }
      else valid = false;
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test beta
   *  Method is invalid
   * - result error -32600 Invalid
   */
  c.call({"jsonrpc": "2.0", "method": 1, "params": "foobar", "id": "beta"}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test beta; method is invalid)');

    if (res) {
      if (res.id !== "beta")
        valid = false;
      if (res.error) {
        if (res.error.code !== -32600)
          valid = false;
      }
      else valid = false;
    }
    else valid = false;

    if(debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 1
   * - Strict Mode test missing id value
   * - result error -32600 Invalid
   */
  c.call({"jsonrpc": "2.0", "method": "subtract", "params": [23, 42]}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 1: Strict Mode - id)');

    if (res) {
      if (res.id !== null)
        valid = false;
      if (res.error) {
        if (res.error.code !== -32600)
          valid = false;
      }
      else valid = false;
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });


  /* Client - Test 2
   * - Strict Mode test missing jsonrpc value
   * - result error -32600 Invalid
   */
  c.call({"method": "subtract", "params": [23, 42], "id": 2}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 2; Strict Mode - jsonrpc)');

    if (res) {
      if (res.id !== 2)
        valid = false;
      if (res.error) {
        if (res.error.code !== -32600)
          valid = false;
      }
      else valid = false;
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });


  /* Client - Test 3
   * - Substract test positional
   * - result positive
   */
  c.call({"jsonrpc": "2.0", "method": "subtract", "params": [42, 23], "id": 3}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 3: subtract positional - pos)');

    if (res) {
      // if (res.jsonrpc != '2.0')
      //   valid = false;
      if (res.id !== 3)
        valid = false;
      if (res.result !== 19)
        valid = false;
    }
    else valid = false;

    if(debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });


  /* Client - Test 4
   * - Substract test positional
   * - result negative
   */
  c.call({"jsonrpc": "2.0", "method": "subtract", "params": [23, 42], "id": 4}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 4: subtract positional - neg)');

    if (res) {
      // if (res.jsonrpc != '2.0')
      //   valid = false;
      if (res.id !== 4)
        valid = false;
      if (res.result !== -19)
        valid = false;
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 5
   * - Substract test named
   * - result positive
   */
  c.call({"jsonrpc": "2.0", "method": "subtract", "params": {"minuend": 42, "subtrahend": 23}, "id": 5}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 5: subtract named - pos)');

    if (res) {
      // if (res.jsonrpc != '2.0')
      //   valid = false;
      if (res.id !== 5)
        valid = false;
      if (res.result !== 19)
        valid = false;
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 6
   * - Substract test named
   * - result negative
   */
  c.call({"jsonrpc": "2.0", "method": "subtract", "params": {"subtrahend": 42, "minuend": 23,}, "id": 6}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 6: subtract named - neg)');

    if (res) {
      // if (res.jsonrpc != '2.0')
      //   valid = false;
      if (res.id !== 6)
        valid = false;
      if (res.result !== -19)
        valid = false;
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 7
   *  Substract test invalid param
   * - result error -32602 Invalid Param
   */
  c.call({"jsonrpc": "2.0", "method": "subtract", "params": {"minuend": 23}, "id": 7}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 7; subtract invalid param)');

    if (res) {
      if (res.id !== 7)
        valid = false;
      if (res.error) {
        if (res.error.code !== -32602)
          valid = false;
      }
      else valid = false;
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 8
   *  Notify param
   * - result null
   */
  c.call({"jsonrpc": "2.0", "method": "notify", "params": [1,2,3,4,5], "id": 8}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 8; notify param)');

    if (res)
      valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 9
   *  Notify no param
   * - result null
   */
  c.call({"jsonrpc": "2.0", "method": "notify", "id": 9}, function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 9; notify no param)');

    if (res)
      valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 10
   *  Batch call - invalid empty
   * - result null
   */
  c.call([], function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 10; batch call - invalid empty)');

    if (res) {
      if (res.id !== null)
        valid = false;
      if (res.error) {
        if (res.error.code !== -32600)
          valid = false;
      }
      else valid = false;
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 11
   *  Batch call - invalid not empty
   * - result null
   */
  c.call([1], function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 11; batch call - invalid not empty)');

    if (res) {
      if (res.id !== null)
        valid = false;
      if (res.error) {
        if (res.error.code !== -32600)
          valid = false;
      }
      else valid = false;
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 12
   *  Batch call - invalid not empty++
   * - result null
   */
  c.call([1, 2, 3], function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 12; batch call - invalid not empty++)');

    if (Array.isArray(res)) {
      res.forEach(function (r, i) {
        if (r.id !== null)
          valid = false;
        if (r.error) {
          if (r.error.code !== -32600)
            valid = false;
        }
        else valid = false;
      });
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 13
   *  Batch call - Valid method
   * - result null
   */
  c.call([{"jsonrpc": "2.0", "method": "addup", "params": [23, 42], "id": "13.1"},
               {"jsonrpc": "2.0", "method": "subtract", "params": [23, 42], "id": "13.2"},
               {"jsonrpc": "2.0", "method": "addup", "params": [23, 42, 5], "id": "13.3"}
              ], function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 13; batch call - valid method)');

    if (Array.isArray(res)) {
      res.forEach(function (r, i) {
        switch(r.id) {
          case '13.1':
            if(r.result !== 65)
              valid = false;
          break;
          case '13.2':
            if(r.result !== -19)
              valid = false;
          break;
          case '13.3':
            if(r.result !== 70)
              valid = false;
          break;
          default:
            valid = false;
          break;
        };
      });
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 14
   *  Batch call - valid notify
   * - result null
   */
  c.call([{"jsonrpc": "2.0", "method": "notify", "params": [23], "id": "14.1"},
               {"jsonrpc": "2.0", "method": "notify", "params": [23, 42], "id": "14.2"},
               {"jsonrpc": "2.0", "method": "notify", "params": [23, 42, 5], "id": "14.3"}
              ], function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 14; batch call - valid notify)');

    if (res)
      valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });

  /* Client - Test 15
   *  Batch call - mix
   * - result null
   */
  c.call([{"jsonrpc": "2.0", "method": "addup", "params": [23, 42], "id": "15.1"},
          {"jsonrpc": "2.0", "method": "notify", "params": [23, 42], "id": "15.2"},
          {"jsonrpc": "2.0", "method": "subtract", "params": [23, 42], "id": "15.3"},
          {"jsonrpc": "2.0", "method": "foobar", "params": [23, 42], "id": "15.4"},
          {"jsonrpc": "2.0", "method": "addup", "params": [23, 42, 5], "id": "15.5"},
          {"jsonrpc": "2.0", "method": 1, "params": [23, 42, 5], "id": "15.6"}
        ], function (err, res) {
    var valid = true;

    if (debug)
      console.log('=> Running Test Validation. (Test 15; batch call - mix)');
    
    if (Array.isArray(res)) {
      res.forEach(function (r, i) {
        switch(r.id) {
          case '15.1':
            if(r.result !== 65)
              valid = false;
            break;
          case '15.2':
            valid = false;
            break;
          case '15.3':
            if(r.result !== -19)
              valid = false;
            break;
          case '15.4':
             if (r.error) {
               if (r.error.code !== -32601)
                valid = false;
            }
            else valid = false;
             break;
          case '15.5':
            if(r.result !== 70)
              valid = false;
            break;
          case '15.6':
             if (r.error) {
               if (r.error.code !== -32600)
                valid = false;
            }
            else valid = false;
             break;
          default:
            valid = false;
            break;
        };
      });
    }
    else valid = false;

    if (debug) {
      if (valid) console.log("--> Test Passed");
      else console.log("--> Test Failed");
    }

    reportstat(valid);
  });
};

/**
 * Execute Tests
 **/

/* TODO Perform test with ssl and auth */
// client = new rpc.Client(optsClient);
// server = new rpc.Server(optsServer);

/* TODO Perform test with ssl but no auth */
// optsClient.auth = null;
// optss.auth = null;
// client = new rpc.Client(optsClient);
// server = new rpc.Server(optsServer);


/* Perform test without ssl but with auth */
optsClient.ssl = null; optsClient.port = 5081;
optsServer.ssl = null; optsServer.port = 5081;

var c81 = new rpc.Client(optsClient);
var s81 = new rpc.Server(optsServer);
var d81 = false;

s81.start(function (error) {
  if (!error) {
    console.log('- Test (s81): start (ssl = off, auth = on)');
    testBatch(s81, c81, '(s81)', d81, function() {      
      s81.stop(function (error) {
        if (error) console.log(error);
        else console.log('- Test s81 end.');
      });
    });
  }
  else {
    console.log('- Server (s81): start failed');
    console.log(error);
  }
});


/* Perform test without ssl and no auth */
optsClient.hash = null; optsClient.port = 5082;
optsServer.auth = null; optsServer.port = 5082;

var c82 = new rpc.Client(optsClient);
var s82 = new rpc.Server(optsServer);
var d82 = false;

s82.start(function (error) {
  if (!error) {
    console.log('- Test (s82): start (ssl = off, auth = off)');
    testBatch(s82, c82, '(s82)', d82, function() {      
      s82.stop(function (error) {
        if (error) console.log(error);
        else console.log('- Test s82 end');
      });
    });
  }
  else {
    console.log('- Server (s82): start failed');
    console.log(error);
  }
});