/* Basic extendable http authentication
 *
 * new Auth (options)
 *  - options (object): json options object
 *
 *  Define: json options object: {
 *    body: string body for 401, dafault "<h1>401 Auth Required!</h1>"
 *    message: string realm name for 401, default "Rpc Authentication"
 *
 *    ext: json ext object width functions that extend authentecation, default null
 *    users: array [] = json user object (only used if ext.users is null), default []
 *
 *    Define: 'json ext object': {
 *      hash: function (string inHash, string dbHash) -> boolean true when match, default: null
 *      users: function (json user object) -> json user object or null when invalid, default null
 *
 *      log: function (obj req, obj res, obj user, func callback (obj req, obj res, obj user)) -> null, default null
 *      block: function (obj req) -> boolean true when request should be blocked, default null
 *    }
 *
 *    Define: 'json user object': {
 *      login: string user login id
 *      hash: string user password
 *    }
 *  }
 */
var Auth = function (options) {
  var self = this;
  options = options || {};

  var ext = {};
  var body = options.body || "<h1>401 Auth Required!</h1>";
  var users = options.users || [];
  var message = options.message || "Rpc Authentication";

  if(options.ext) {
    if (typeof options.ext.log === 'function')
      ext.log = options.ext.log;

    if (typeof options.ext.hash === 'function')
      ext.hash = option.ext.hash;

    if (typeof options.ext.users === 'function')
      ext.users = options.ext.users;

    if (typeof options.ext.block === 'function')
      ext.block = options.ext.block;
  }

  /* Private: Validates user credentials */
  var validate = function (user) {
    var out = null;
    

    if(ext.users)
      out = ext.users(user);
    else {
      for (var i = 0; i < users.length; i++) {
        if (users[i].login === user[0]) {
          if (ext.hash) {
            if (ext.hash(user[1], users[i].hash))
              out = users[i];
          }
          else {
            if (users[i].hash === user[1]) {
              out = users[i];
            }
            break;
          }
        }
      }
    }
    return out;
  };

  /* Private: Returns user from auth header */
  var checkUser = function (req) {
    var user = null;
    var header = req.headers['authorization'];

    if (header) {
      user = validate(
        new Buffer(header.split(" ")[1], 'base64')
        .toString('utf8')
        .split(':')
      );
    }

    return user;
  };

  /* Private: Send a 401 response */
  var requestUser = function (res) {
    res.setHeader("WWW-Authenticate", 'Basic realm="' + message + '"');
    res.writeHead(401);
    res.end(body);
  };


  /* Public: Check for autherised user.
   *
   *  - req: http request object, required
   *  - res: http result object, required
   *  - callback: function(obj req, obj res, obj user) -> null, required
   */
  this.check = function (req, res, callback) {
    var user = null;

    //TODO Fix me - block extention
    //if (ext.block && !ext.block(req))
    user = checkUser(req);

    if (user)
      if(ext.log) ext.log(req, res, user, callback);
      else callback(req, res, user);
    else
      if(ext.log) ext.log(req, res, null, null);
      else requestUser(res);
  };
};

module.exports = Auth;