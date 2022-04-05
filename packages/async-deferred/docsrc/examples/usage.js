const { Deferred } = require("@esfx/async-deferred");

const deferred = new Deferred();

// to resolve the deferred:
deferred.resolve(1);

// to reject the deferred:
deferred.reject(new Error());

// get the promise for the deferred:
deferred.promise;