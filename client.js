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
    typeof config.methods !== "object" ||
    config.methods == null ||
    typeof config.url !== "string"
  ) {
    throw new Error(
      "Invalid config provided to createClient. You must provide an object with, at minimum, a `url` key, which is a string, and a `methods` key, which is an array."
    );
  }

  var clientObj = {};

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

  return clientObj;
};
