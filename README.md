# little-api

`little-api` is a wrapper around express and XHRs that gives you a nice JSON-over-HTTP RPC server and client with little configuration.

## Installation

```
npm install --save little-api
```

## Usage

On the server:

```js
const createServer = require("little-api/server");

const server = createServer({
  methods: {
    // Fill this object with functions that do whatever you want.
    // They can return a JSON-serializable value or a Promise that resolves to one.
    uppercase(...words) {
      return words.map((word) => word.toUpperCase());
    },
    uppercaseAsync(...words) {
      return Promise.resolve(words.map((word) => word.toUpperCase()));
    },
  },
});

// `server` is an express server.
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

## Notes/limitations

- JSON is used as the transport format, so the arguments passed into client functions must be JSON-serializable, and the return/resolve values from the server must be JSON-serializable.
- The client relies on the globals `XMLHttpRequest` and `Promise`.

## API

### `createServer(serverConfig: Object) => Express$App`

The `createServer` function comes from the module `"little-api/server"`. It returns an express application that you can either call `listen` on or mount somewhere in a larger express app.

`serverConfig` is an Object that must have at least these keys:

- `methods` - An Object of functions that should be exposed as API methods to the client.

And may optionally also have these keys:

- `requestSizeLimit` - The maximum permitted request size. Defaults to `"1GB"`.
- `noCors` - Set to true disable CORS. It's enabled by default.
- `corsOptions` - Options to pass to the [cors package](https://www.npmjs.com/package/cors).

### `createClient(clientConfig: Object) => Object`

The `createClient` function comes from the module `"little-api/client"`. It returns an Object whose entries are functions cooresponding to the methods on the server. Each function has a property called `sync` which is a function that use a Synchronous XHR instead of an async one.

`clientConfig` is an Object that must have at least these keys:

- `url` - The URL to the server, eg. `"http://localhost:8080"`
- `methods` - An Array of strings, containing the names of all the methods available on the server.

And may optionally also have these keys:

- `timeout` - The timeout in milliseconds to set on the XHRs used to communicate with the server. Defaults to 30 seconds; set to `0` for no timeout.

## License

MIT
