## Socket.io Roundtrip

Sometimes you'd like to use socket-io, but you'd like to pair
an emitted event with an event emitted in response, similar to 
a traditional http request. This adds a small helper for the 
client & server for this situation.

### Use:

#### Server:

```js
var io = require('socket.io')(config);
var roundtripServer = require('socket.io-roundtrip')(io);

roundtripServer('some-event', function(data, cb) {

  // do something with data

  cb(null, resp);

  // or cb(err); if there's an error

});

```

#### Client:

```js
var io = require('socket.io')(endpoint);
var roundtripClient = require('socket.io-roundtrip')(io);

roundtripClient('some-event', {name: 'test'}, function(err, resp) {
  if (err) // handle error

  // handle response data
});
```

### License

MIT
