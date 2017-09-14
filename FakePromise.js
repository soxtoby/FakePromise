(function (global) {
    var asyncQueue = [];
    var originalPromise = global.Promise;

    function FakePromise(resolver) {
        if (typeof resolver != 'function')
            throw new TypeError("Promise resolver " + resolver + " is not a function");

        this.isPending = true;
        this.isResolved = false;
        this.isRejected = false;
        this._callbacks = [];

        try {
            resolver(this.resolve.bind(this), this.reject.bind(this));
        } catch (error) {
            this.reject(error);
        }
    }

    FakePromise.prototype = {
        then: function (resolveCallback, rejectCallback) {
            var self = this;

            return new FakePromise(function (resolve, reject) {
                var resolveHandler = resolveCallback ? handler(resolveCallback) : resolve;
                var rejectHandler = rejectCallback ? handler(rejectCallback) : reject;

                if (self.isResolved)
                    asyncQueue.push(resolveHandler.bind(null, self.value));
                else if (self.isRejected)
                    asyncQueue.push(rejectHandler.bind(null, self.error));
                else
                    self._callbacks.push([resolveHandler, rejectHandler]);

                function handler(callback) {
                    return function (value) {
                        try {
                            var result = callback(value);
                        } catch (error) {
                            reject(error);
                        }

                        if (result && typeof result.then == 'function')
                            result.then(resolve, reject);
                        else
                            resolve(result);
                    }
                }
            });
        },

        catch: function (rejectCallback) {
            return this.then(null, rejectCallback);
        },

        resolve: function (value) {
            if (!this.isPending)
                return;

            this.value = value;
            this.isPending = false;
            this.isResolved = true;

            evaluateCallbacks(this, this._callbacks);
        },

        reject: function (error) {
            if (!this.isPending)
                return;

            this.error = error;
            this.isPending = false;
            this.isRejected = true;

            evaluateCallbacks(this, this._callbacks);
        }
    };

    FakePromise.resolve = function (value) {
        try {
            return value instanceof FakePromise ? value
                : value && typeof value.then == 'function' ? new FakePromise(value.then.bind(value))
                : new FakePromise(function (resolve, reject) {
                resolve(value);
            });
        } catch (e) {
            return FakePromise.reject(e);
        }
    };

    FakePromise.reject = function (reason) {
        return new FakePromise(function (resolve, reject) {
            reject(reason);
        });
    };

    FakePromise.all = function (promises) {
        return new FakePromise(function (resolve, reject) {
            var results = [];
            var resolved = 0;
            promises.forEach(waitForPromise);

            function waitForPromise(promise, i) {
                FakePromise.resolve(promise).then(
                    function (value) {
                        results[i] = value;
                        resolved++;
                        if (resolved == promises.length)
                            resolve(results);
                    },
                    reject
                );
            }
        });
    };

    FakePromise.race = function (promises) {
        return new FakePromise(function (resolve, reject) {
            promises.forEach(function (p) { FakePromise.resolve(p).then(resolve, reject); });
        });
    };

    FakePromise.flush = function () {
        var action;
        while (action = asyncQueue.shift())
            action();
    };

    FakePromise.clear = function () {
        asyncQueue.length = 0;
    };

    FakePromise.defer = function () {
        return new FakePromise(function () { });
    };

    FakePromise.replacePromise = function () {
        global.Promise = FakePromise;
    };

    FakePromise.restorePromise = function () {
        global.Promise = originalPromise;
    };

    function identity(value) {
        return value;
    }

    function evaluateCallbacks(promise, callbacks) {
        callbacks.forEach(promise.then.apply.bind(promise.then, promise));
        callbacks.length = 0;
    }

    global.FakePromise = FakePromise;
})(this);