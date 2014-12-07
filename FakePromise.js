(function (global) {
    function FakePromise(resolver) {
        if (typeof resolver != 'function')
            throw new TypeError("Promise resolver " + resolver + " is not a function");

        this.isPending = true;
        this.isResolved = false;
        this.isRejected = false;
        this.callbacks = [];

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
                var resolveHandler = handler(resolveCallback || identity, resolve);
                var rejectHandler = handler(rejectCallback || identity, reject);

                if (self.isResolved)
                    FakePromise.callbacks.push(resolveHandler.bind(null, self.value));
                else if (self.isRejected)
                    FakePromise.callbacks.push(rejectHandler.bind(null, self.error));
                else
                    self.callbacks.push([resolveHandler, rejectHandler]);

                function handler(callback, settleSame) {
                    return function (value) {
                        try {
                            var result = callback(value);
                        } catch (error) {
                            reject(error);
                        }

                        if (result && typeof result.then == 'function')
                            result.then(resolve, reject);
                        else
                            settleSame(result);
                    }
                }

                function identity(value) {
                    return value;
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

            this.callbacks.forEach(function (callbacks) {
                this.then.apply(this, callbacks);
            }.bind(this));
            this.callbacks.length = 0;
        },

        reject: function (error) {
            if (!this.isPending)
                return;

            this.error = error;
            this.isPending = false;
            this.isRejected = true;

            this.callbacks.forEach(function (callbacks) {
                this.then.apply(this, callbacks);
            }, this);
            this.callbacks.length = 0;
        }
    };

    FakePromise.callbacks = [];

    FakePromise.resolve = function (value) {
        try {
            return value instanceof FakePromise ? value
                : typeof value.then == 'function' ? new FakePromise(value.then.bind(value))
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
            var promiseCount = forEach(promises, waitForPromise);

            function waitForPromise(promise, i) {
                FakePromise.resolve(promise).then(
                    function (value) {
                        results[i] = value;
                        resolved++;
                        if (resolved == promiseCount)
                            resolve(results);
                    },
                    reject
                );
            }
        });
    };

    FakePromise.race = function (promises) {
        return new FakePromise(function (resolve, reject) {
            forEach(promises, function (p) { FakePromise.resolve(p).then(resolve, reject); });
        });
    };

    FakePromise.flush = function () {
        var callback;
        while (callback = this.callbacks.shift())
            callback();
    };

    FakePromise.defer = function () {
        return new FakePromise(function () { });
    };

    function forEach(iterable, action) {
        if (Array.isArray(iterable)) {
            iterable.forEach(action);
            return iterable.length;
        } else {
            var i = 0;
            for (var item of iterable)
                action(item, i++);
            return i;
        }
    }

    global.FakePromise = FakePromise;
})(this);