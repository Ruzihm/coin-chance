module.exports = function (classes){
  'use strict';

  var
    Connection = classes.Connection,
    HttpServerConnection = Connection.$define('HttpServerConnection', {
    construct: function (server, req, res){
      var self = this;

      this.$super(server);

      this.req = req;
      this.res = res;
      this.isStreaming = false;

      this.res.connection.on('end', function responseEnd(){
        self.emit('end');
      });
    },

    /**
     * Can be called before the response callback to keep the connection open.
     */
    stream: function (onend){
      this.$super(onend);

      this.isStreaming = true;
    },

    /**
     * Send the client additional data.
     *
     * An HTTP connection can be kept open and additional RPC calls sent through if
     * the client supports it.
     */
    write: function (data){
      if (!this.isStreaming) {
        throw new Error('Cannot send extra messages via non - streaming HTTP');
      }

      if (!this.res.connection.writable) {
        // Client disconnected, we'll quietly fail
        return;
      }

      this.res.write(data);
    }
  });

  return HttpServerConnection;
};