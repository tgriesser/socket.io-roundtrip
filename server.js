module.exports = function(socket) {
  
  "use strict";
  
  var events = Object.create(null);

  socket.on('__roundtrip:server__', function(data) {
    var uuid         = data.uuid;
    var wrappedEvent = data.wrappedEvent;
    var payload      = data.payload;
    var toFire       = events[wrappedEvent];
    function handler(err, resp) {
      if (err) {
        var errorPayload = {};
        if (err instanceof Error) {
          errorPayload.message = err.message;
          if (sendFullError) {
            errorPayload.stack = err.stack;
            errorPayload.json  = err.toJSON ? JSON.stringify(err) : null;
          }
        } else {
          errorPayload.message = err;
        }
        socket.emit('__roundtrip:error__', {
          uuid: uuid,
          payload: errorPayload
        });
      } else {
        socket.emit('__roundtrip__', {
          uuid: uuid,
          payload: resp
        });
      }
    }
    if (toFire) {
      var firingFn      = toFire[0];
      var sendFullError = toFire[1];
      try {
        firingFn(payload, handler);
      } catch (e) {
        handler(e);
      }
    }
  });

  return function(evt, fn, sendFullError) {
    if (events[evt]) {
      throw new Error('Only one rountrip event may be registered');
    }
    if (typeof fn !== 'function') {
      throw new Error('The second arugment to roundtrip should be a handler function');
    }
    events[evt] = [fn, sendFullError];
  };

};