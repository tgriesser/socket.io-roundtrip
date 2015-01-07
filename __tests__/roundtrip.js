jest.autoMockOff();
var when   = require('when');
var events = require('events');
var client = require('../client');
var server = require('../server');

describe('roundtrip', function () {
  var eventBus, roundtripClient, roundtripServer;

  beforeEach(function() {
    eventBus = new events.EventEmitter();
    roundtripClient = client(eventBus, when.promise);
    roundtripServer = server(eventBus);
  });
  
  pit('should handle a roundtrip with the data', function() {
    roundtripServer('testing', function(data) {
      expect(data.name).toBe('Test User');
      return {name: 'Tim'};
    });
    return roundtripClient('testing', {name: 'Test User'}).then(function(resp) {
      expect(resp.name).toBe('Tim');
    });
  });

  pit('should send an error with the message property', function() {
    roundtripServer('testing', function(data) {
      throw new Error('failed');
    });
    return roundtripClient('testing', {name: 'Test User'}).catch(function(err) {
      expect(err.message).toBe('failed');
    });
  });

  pit('should accept a custom error handler to roundtripServer', function() {
    
    function serverFn(data, cb) {
      var err = new Error('failed');
      err.toJSON = function() { return {test: 'json'}; };
      err.stack = 'test-stack-trace';
      throw err;
    }

    roundtripServer('testing', serverFn, function(err) {
      return {message: 'failed'};
    });
    roundtripServer('testing-with-error', serverFn);
    
    return roundtripClient('testing', {name: 'Test User'})
      .catch(function(err) {
        expect(err.message).toBe('failed');
        expect(err.json).toBeUndefined();
      })
      .then(function() {
        return roundtripClient('testing-with-error', {name: 'Test User'});
      })
      .catch(function(err) {
        expect(err.message).toBe('failed');
        expect(err.json).toEqual({"test": "json"});
        expect(err.stack).toBe('test-stack-trace');
      });
  });

  pit('should not crash on throw errors', function () {
    
    function serverFn(data, cb) {
      throw new Error('failed');
    }

    roundtripServer('testing', serverFn);
    
    return roundtripClient('testing', {name: 'Test User'})
      .catch(function(err) {
        expect(err.message).toBe('failed');
        expect(err.json).toBeNull();
      });

  });

  pit('should not crash on throw errors', function () {
    
    function serverFn(data, cb) {
      throw new Error('failed');
    }

    roundtripServer('testing', serverFn);
    return roundtripClient('testing', {name: 'Test User'})
      .catch(function(err) {
        expect(err.message).toBe('failed');
        expect(err.json).toBeNull();
      });

  });

});