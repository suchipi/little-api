var url = require("url");
var http = require("http");
var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var WebSocket = require("ws");
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

function b64Decode(b64String) {
  var buf;
  if (typeof Buffer.from === "function") {
    buf = Buffer.from(b64String, "base64");
  } else {
    buf = new Buffer(b64String, "base64");
  }
  return buf.toString("utf-8");
}

function decodeSocketData(request) {
  var url = request.url.slice(1); // remove leading '/'
  var data = JSON.parse(b64Decode(url));
  return data;
}

module.exports = function createServer(config) {
  debug("createServer", config);

  if (typeof config !== "object" || config == null) {
    throw new Error(
      "Invalid config provided to createServer. You must provide an object."
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

  var server = http.createServer(app);
  var wsServer = new WebSocket.Server({ server: server });

  wsServer.on("connection", function onConnection(socket, request) {
    try {
      var data = decodeSocketData(request);
    } catch (err) {
      socket.close(4400, "Invalid request");
      return;
    }
    var methodName = data.methodName;
    var args = data.args;

    try {
      var method = config.socketMethods[methodName];
      if (method == null) {
        socket.close(4404, "No such socket method: '" + methodName + "'");
        return;
      } else {
        method.apply(null, [socket].concat(args));
      }
    } catch (err) {
      // According to RFC6455, a WebSocket control frame must be 125 bytes or
      // smaller, and in a Close control frame, the first two bytes are the
      // status code (in this case, 4500). That leaves 123 bytes left for the
      // reason string.
      var maxReasonSize = 123;
      socket.close(
        4500,
        err.stack.replace(/\n {4}at/g, "\nat").slice(0, maxReasonSize)
      );
    }
  });

  return server;
};
