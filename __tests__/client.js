jest.autoMockOff();
var when   = require('when');
var events = require('events');
var client = require('../client');

describe('roundtrip client', function () {
  
  var emitter;

  beforeEach(function() {
    emitter = new events.EventEmitter();
  });
  
  it('should take a socket instance (emitter) and return a function', function() {
    var roundtripClient = client(emitter);
    expect(typeof roundtripClient).toBe('function');
  });

  it('should take a second argument which signals to throws on undefined roundtrips', function() {
    var roundtripClient = client(emitter, when.promise);
    expect(function() {
      emitter.emit('__roundtrip__', {});
    }).not.toThrow();
    var x;
    roundtripClient = client(emitter, when.promise, function(type, err) {
      x = type;
    });
    emitter.emit('__roundtrip__', {});
    expect(x).toEqual('uuid');
  });

});