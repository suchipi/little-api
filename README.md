# little-api

`little-api` is a wrapper around express, XHRs, and WebSockets that gives you a nice JSON-over-HTTP/WS RPC server and client with little configuration.

## Installation

```
npm install --save little-api
```

## HTTP Usage

On the server:

```js
const createServer = require("little-api/server");

const server = createServer({
  methods: {
    // Fill this object with functions that do whatever you want.
    // They will be wrapped with an HTTP API that makes them available to clients.
    // These functions can return a JSON-serializable value or a Promise that resolves to one.
    uppercase(...words) {
      return words.map((word) => word.toUpperCase());
    },
    uppercaseAsync(...words) {
      return Promise.resolve(words.map((word) => word.toUpperCase()));
    },
  },
});

// `server` is a node net.Server.
server.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
```

On the client:

```js
const createClient = require("little-api/client");

const api = createClient({
  url: "http://localhost:8080",
  methods: ["uppercase", "uppercaseAsync"],
});

// api is an object with properties on it for each method:
console.log(api);
// {
//   uppercase: function uppercase() { ... },
//   uppercaseAsync: function uppercase() { ... }
// }

// calling each method passes the args to the server, calls the cooresponding method serverside, and returns a Promise with the result:
api.uppercase("hello", "world").then((results) => {
  console.log(results); // ["HELLO", "WORLD"]
});

// You can use the `.sync` property on each function to use Synchronous XHRs:
const results = api.uppercase.sync("hello", "world");
console.log(results); // ["HELLO", "WORLD"]
```

## WebSocket Usage

You can also use little-api for your websocket server.

On the server:

```js
const createServer = require("little-api/server");

const server = createServer({
  // Use the socketMethods key instead of methods. You can use both socketMethods and methods together if you want to.
  socketMethods: {
    // Fill this object with functions that handle incoming socket connections.
    // Each will receive a socket object and any args that were passed to the function clientside.
    fancyEcho(socket, repeatTimes, uppercase = false) {
      socket.on("message", (message) => {
        message = message.repeat(repeatTimes);
        if (uppercase) {
          message = message.toUpperCase();
        }
        socket.send(message);
      });
    },
  },
});

// `server` works the same as usual.
server.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
```

On the client:

```js
const createClient = require("little-api/client");

const api = createClient({
  url: "http://localhost:8080",
  socketMethods: ["fancyEcho"],
});

// api has properties for each socket method on it in addition to any normal methods you specify:
console.log(api);
// {
//   fancyEcho: function fancyEcho() { ... }
// }

// calling a function associated with a socket method will return a websocket instance:
const websocket = api.fancyEcho(/* repeatTimes */ 3, /* uppercase */ true);
websocket.addEventListener("message", (event) => {
  console.log(event.data);
});
websocket.send("hello"); // logs HELLOHELLOHELLO
websocket.send("world"); // logs WORLDWORLDWORLD
```

## Notes/limitations

- JSON is used as the transport format, so the arguments passed into client functions must be JSON-serializable, and the return/resolve values from the server must be JSON-serializable.
- The client relies on the globals `XMLHttpRequest`, `WebSocket`, `btoa`, and `Promise`.

## API

### `createServer(serverConfig: Object) => net.Server`

The `createServer` function comes from the module `"little-api/server"`. It returns a node net.Server that you can call `listen` on.

`serverConfig` is an Object that may have any of these keys:

- `methods` - An Object of functions that should be exposed as API methods to the client.
- `socketMethods` - An Object of functions that should be run when a websocket client connects. Each receives a `socket` object and the args that were passed clientside.
- `requestSizeLimit` - The maximum permitted request size. Defaults to `"1GB"`.
- `noCors` - Set to true disable CORS. It's enabled by default.
- `corsOptions` - Options to pass to the [cors package](https://www.npmjs.com/package/cors).
- `withApp` - A function that, if present, will be called with the express app right before it is passed to `http.createServer`. You can use this to add your own method handlers or middleware. Note that for the functions defined in `methods` to work, the `POST /` handler should be left alone.

### `createClient(clientConfig: Object) => Object`

The `createClient` function comes from the module `"little-api/client"`. It returns an Object whose entries are functions cooresponding to the methods on the server. Each non-socket-method function has a property called `sync` which is a function that use a Synchronous XHR instead of an async one.

`clientConfig` is an Object that must have at least this key:

- `url` - The URL to the server, eg. `"http://localhost:8080"`

And may optionally also have these keys:

- `methods` - An Array of strings, containing the names of all the methods available on the server.
- `socketMethods` - An Array of strings, containing the names of all the socket methods available on the server.
- `timeout` - The timeout in milliseconds to set on the XHRs used to communicate with the server. Defaults to 30 seconds; set to `0` for no timeout.

## License

MIT
