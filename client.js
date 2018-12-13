var fetchJSON = require("./fetchJSON");

function handleResponse(response) {
  if (response.success) {
    return response.result;
  } else {
    var error = new Error();
    for (var key in response.err) {
      if ({}.hasOwnProperty.call(response.err, key)) {
        Object.defineProperty(error, key, {
          writable: true,
          enumerable: false,
          configurable: true,
          value: response.err[key],
        });
      }
    }

    throw error;
  }
}

module.exports = function createClient(config) {
  if (
    typeof config !== "object" ||
    config == null ||
    typeof config.url !== "string"
  ) {
    throw new Error(
      "Invalid config provided to createClient. You must provide an object with, at minimum, a `url` key, which is a string."
    );
  }

  var clientObj = {};

  if (config.methods != null) {
    config.methods.forEach(function(methodName) {
      function doRequest() {
        return fetchJSON(
          "POST",
          config.url,
          {
            methodName,
            args: [].slice.call(arguments),
          },
          false,
          config.timeout
        ).then(handleResponse);
      }
      doRequest.sync = function doRequestSync() {
        return handleResponse(
          fetchJSON(
            "POST",
            config.url,
            {
              methodName,
              args: [].slice.call(arguments),
            },
            true,
            config.timeout
          )
        );
      };

      Object.defineProperty(doRequest, "name", { value: methodName });
      Object.defineProperty(doRequest.sync, "name", {
        value: methodName + ".sync",
      });

      clientObj[methodName] = doRequest;
    });
  }

  const socketUrl = config.url
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");

  if (config.socketMethods != null) {
    config.socketMethods.forEach(function(methodName) {
      function openSocket() {
        var socket = new WebSocket(
          socketUrl +
            "/" +
            btoa(
              JSON.stringify({
                methodName,
                args: [].slice.call(arguments),
              })
            )
        );
        socket.onclose = function onclose(event) {
          var message =
            "Socket closed: " + (event.reason || "Code " + event.code);

          // Log close messages by default to provide a better UX. This can be overridden.
          if (event.code === 4500 || event.code === 4404) {
            console.error(new Error(message));
          } else {
            console.warn(message);
          }
        };
        return socket;
      }

      Object.defineProperty(openSocket, "name", { value: methodName });

      clientObj[methodName] = openSocket;
    });
  }

  return clientObj;
};
