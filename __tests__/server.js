jest.autoMockOff();
var events = require('events');
var server = require('../server');

describe('roundtrip server', function () {
  
  var emitter;

  beforeEach(function() {
    emitter = new events.EventEmitter();
  });

  it('should take a socket instance (emitter) and return a function', function () {
    var roundtrip = server(emitter);
    expect(typeof roundtrip).toBe('function');
  });

  it('should throw if the same event is added twice', function() {
    var roundtrip = server(emitter);
    roundtrip('event', function() {});
    expect(function() {
      roundtrip('event', function() {});
    }).toThrow('Only one rountrip event may be registered');
  });

});