/* global XMLHttpRequest, Promise */

module.exports = function fetchJSON(method, url, data, sync, timeout) {
  var resolve, reject;
  var promise = new Promise((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  function handleError(err) {
    if (sync) {
      throw err;
    } else {
      reject(err);
    }
  }

  try {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, !sync);

    if (!sync && timeout !== 0) {
      xhr.timeout = timeout || 30000;
    }

    xhr.onload = xhr.onreadystatechange = function(event) {
      if (xhr.readyState === 4) {
        resolve(xhr.responseText);
      }
    };

    xhr.onerror = function(event) {
      handleError(new Error(xhr.statusText));
    };

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(JSON.stringify(data));

    var returnValue;
    if (sync) {
      returnValue = JSON.parse(xhr.responseText);
    } else {
      returnValue = promise.then((responseData) => JSON.parse(responseData));
    }
    return returnValue;
  } catch (err) {
    handleError(err);
  }
};
