var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var debug = require("debug")("little-api");

function handleError(err, res) {
  res.status(500).send({
    success: false,
    err: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
    },
  });
}

function handleSuccess(result, res) {
  res.status(200).send({
    success: true,
    result: result,
  });
}

module.exports = function createServer(config) {
  debug("createServer", config);

  if (
    typeof config !== "object" ||
    config == null ||
    typeof config.methods !== "object" ||
    config.methods == null
  ) {
    throw new Error(
      "Invalid config provided to createServer. You must provide an object with, at minimum, a `methods` key, which is an object."
    );
  }

  var app = express();
  app.use(
    bodyParser.json({
      limit: config.requestSizeLimit || "1GB",
    })
  );

  if (!config.noCors) {
    app.use(cors(config.corsOptions));
    app.options("*", cors());
  }

  app.post("/", function handleRequest(req, res) {
    debug("handleRequest", req.body);
    try {
      var methodName = req.body.methodName;
      if (methodName == null) {
        throw new Error("No method name specified");
      }
      var method = config.methods[methodName];
      if (method == null) {
        throw new Error("No such method: '" + methodName + "'");
      }

      var args = req.body.args;
      var result = method.apply(null, args);
      if (
        typeof result === "object" &&
        result != null &&
        typeof result.then === "function"
      ) {
        result.then(
          function onResolve(value) {
            handleSuccess(value, res);
          },
          function onReject(err) {
            handleError(err, res);
          }
        );
      } else {
        handleSuccess(result, res);
      }
    } catch (err) {
      handleError(err, res);
    }
  });

  return app;
};
