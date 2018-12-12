const createClient = require("../client");

const api = createClient({
  url: "http://localhost:8080",
  methods: ["uppercase", "uppercaseAsync", "throwErr", "rejectErr"],
});

global.api = api;
