jest.autoMockOff();
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
    var roundtripClient = client(emitter);
    expect(function() {
      emitter.emit('__roundtrip__', {});
    }).not.toThrow();
    roundtripClient = client(emitter, true);
    expect(function() {
      emitter.emit('__roundtrip__', {});
    }).toThrow('Non-existent UUID passed from server.');
  });

});