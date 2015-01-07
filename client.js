function SocketClient(io, Promise, errorHandler) {
  "use strict";

  var UUID = require('node-uuid');
  var pendingQueue = {};

  function handleError(type, data) {
    if (errorHandler) {
      errorHandler(type, data);
      if (type === 'timeout') {
        delete pendingQueue[data.uuid];
      }
    }
  }

  io.on('__roundtrip__', function(data) {
    var uuid     = data.uuid;
    var payload  = data.payload;
    var pending  = pendingQueue[uuid];
    if (!pending) return handleError('uuid', data);
    if (pending === true) return handleError('timeout', data);
    delete pendingQueue[uuid];
    pending[0](payload);
  });

  io.on('__roundtrip:error__', function(data) {
    var uuid     = data.uuid;
    var payload  = data.payload;
    var pending  = pendingQueue[uuid];
    if (!pending) return handleError('uuid', data);
    if (pending === true) return handleError('timeout', data);
    var err = new IncomingError(payload.message);
    Object.keys(payload).forEach(function(key) {
      if (key !== 'message') {
        err[key] = key === 'json' ? JSON.parse(payload[key]) : payload[key];
      }
    });
    delete pendingQueue[uuid];
    pending[1](err);
  });

  // Emit a "rountrip" event, resolving a pendingQueue when the result
  // succeeds or fails. Returns a promise.
  return function(evt, data, maxTimeout) {
    if (arguments.length === 2) {
      maxTimeout = 20000;
    }
    return new Promise(function(resolver, rejecter) {
      var timer, uuid = UUID.v4();
      if (maxTimeout !== 0) {
        timer = setTimeout(function() {
          rejecter(new TimeoutError('Max timeout of ' + maxTimeout + ' exceeded.'));
          pendingQueue[uuid] = true;
        }, maxTimeout);
      }
      
      pendingQueue[uuid] = [function(resp) {
        if (timer) clearTimeout(timer);
        resolver(resp);
      }, function(err) {
        if (timer) clearTimeout(timer);
        rejecter(err);
      }];

      io.emit('__roundtrip:server__', {
        uuid: uuid,
        wrappedEvent: evt,
        payload: data
      });
    });
  };

}

var TimeoutError = require('create-error')('SocketTimeoutError');
SocketClient.TimeoutError = TimeoutError;

var IncomingError = require('create-error')('IncomingError');
SocketClient.IncomingError = IncomingError;

module.exports = SocketClient;