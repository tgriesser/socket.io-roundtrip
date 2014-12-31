jest.autoMockOff();
var events = require('events');
var client = require('../client');
var server = require('../server');

describe('roundtrip', function () {
  var eventBus, roundtripClient, roundtripServer;

  beforeEach(function() {
    eventBus = new events.EventEmitter();
    roundtripClient = client(eventBus);
    roundtripServer = server(eventBus);
  });
  
  it('should handle a roundtrip with the data', function(done) {
    roundtripServer('testing', function(data, cb) {
      expect(data.name).toBe('Test User');
      cb(null, {name: 'Tim'});
    });
    roundtripClient('testing', {name: 'Test User'}, function(err, resp) {
      expect(err).toBeNull();
      expect(resp.name).toBe('Tim');
    });
  });

  it('should send an error with the message property', function(done) {
    roundtripServer('testing', function(data, cb) {
      cb(new Error('failed'));
    });
    roundtripClient('testing', {name: 'Test User'}, function(err, resp) {
      expect(err.message).toBe('failed');
    });
  });

  it('should send stack & json from the server, with a truthy third argument to roundtripServer', function(done) {
    
    function serverFn(data, cb) {
      var err = new Error('failed');
      err.toJSON = function() { return {test: 'json'}; };
      err.stack = 'test-stack-trace';
      cb(err);
    }

    roundtripServer('testing', serverFn);
    roundtripServer('testing-with-error', serverFn, true);
    roundtripClient('testing', {name: 'Test User'}, function(err, resp) {
      expect(err.message).toBe('failed');
      expect(err.json).toBeUndefined();
    });
    roundtripClient('testing-with-error', {name: 'Test User'}, function(err, resp) {
      expect(err.message).toBe('failed');
      expect(err.json).toBe('{"test":"json"}');
      expect(err.stack).toBe('test-stack-trace');
    });
  });

  it('should not crash on throw errors', function () {
    
    function serverFn(data, cb) {
      throw new Error('failed');
    }

    roundtripServer('testing', serverFn);
    roundtripClient('testing', {name: 'Test User'}, function(err, resp) {
      expect(err.message).toBe('failed');
      expect(err.json).toBeUndefined();
    });

  });

});