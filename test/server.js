const createServer = require("../server");

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
    throwErr() {
      throw new Error("nah!");
    },
    rejectErr() {
      return Promise.reject(new Error("nope!!!"));
    },
  },
});

// server is an express server.
server.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
