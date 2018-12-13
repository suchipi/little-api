const createClient = require("../client");

const api = createClient({
  url: "http://localhost:8080",
  methods: ["uppercase", "uppercaseAsync", "throwErr", "rejectErr"],
  socketMethods: ["echoSocket", "uppercaseSocket", "errorSocket"],
});

global.api = api;
