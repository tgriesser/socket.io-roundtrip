module.exports = function(socket, globalErrorHandler) {
  
  "use strict";

  var isProd = process.env.NODE_ENV === 'production';
  
  var events   = Object.create(null);
  var handlers = Object.create(null);
  var Promise = require('bluebird');

  socket.on('__roundtrip:server__', function(data) {
    
    var uuid         = data.uuid;
    var wrappedEvent = data.wrappedEvent;
    var payload      = data.payload;
    
    function getErrorPayload(err) {
      var errorHandler = handlers[wrappedEvent] || globalErrorHandler;

      // If there's an errorHandler defined, we can use that to 
      // determine what the returned value should be.
      if (errorHandler) {
        var processedError = errorHandler(err);
        if (processedError) return processedError;
      }

      if (isProd) {
        return {message: 'Error with roundtrip, please contact support.'};
      }

      if (err instanceof Error) {
        return {
          message: err.message,
          stack: err.stack,
          json: (err.toJSON ? JSON.stringify(err) : null)
        };
      }

      return {message: err};
    }
    
    var toFire = events[wrappedEvent];
    
    Promise.try(function() {
      if (toFire) return toFire(payload);
      throw new Error('Handler for ' + wrappedEvent + ' is not defined.');
    })
    .then(function(resp) {
      socket.emit('__roundtrip__', {
        uuid: uuid,
        payload: resp
      });
    })
    .catch(function(err) {
      socket.emit('__roundtrip:error__', {
        uuid: uuid,
        payload: getErrorPayload(err)
      });
    });

  });

  return function(evt, fn, eventErrorHandler) {
    if (events[evt]) {
      throw new Error('Only one rountrip event may be registered');
    }
    if (typeof fn !== 'function') {
      throw new Error('The second arugment to roundtrip should be a handler function');
    }
    events[evt] = fn;
    if (eventErrorHandler) handlers[evt] = eventErrorHandler;
  };

};