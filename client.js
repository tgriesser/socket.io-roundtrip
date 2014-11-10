module.exports = function(io, throwOnUndefined) {
  "use strict";

  var UUID    = require('node-uuid');
  var pending = {};

  io.on('__roundtrip__', function(data) {
    var uuid     = data.uuid;
    var payload  = data.payload;
    var callback = pending[uuid];
    if (!callback) {
      if (throwOnUndefined) {
        throw new Error('Non-existent UUID passed from server.');
      }
    } else {
      callback(null, payload);
    }
  });

  io.on('__roundtrip:error__', function(data) {
    var uuid     = data.uuid;
    var payload  = data.payload;
    var callback = pending[uuid];
    if (!callback) {
      if (throwOnUndefined) {
        throw new Error('Non-existent UUID passed from server.');
      }
    } else {
      var key, err = new Error('rountrip:error');
      // If you need to duck-type check the error.
      err.__roundtrip_error__ = true;
      for (key in payload) {
        err[key] = payload[key];
      }
      callback(err);
    }
  });

  // Emit a "rountrip" event, resolving a callback when the result
  // succeeds or fails.
  return function(evt, data, cb) {
    var uuid = UUID.v4();
    pending[uuid] = function(err, resp) {
      cb(err, resp);
      delete pending[uuid];
    };
    io.emit('__roundtrip:server__', {
      uuid: uuid,
      wrappedEvent: evt,
      payload: data
    });
  };

};