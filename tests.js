when("promise created without a function", function() {
    var create = function () { new FakePromise('foo') };

    it("throws TypeError", function() {
        create.should.throw(TypeError, "Promise resolver foo is not a function");
    });
});

when("promise created with a resolver function", function() {
    var resolver = sinon.spy();
    var sut = new FakePromise(resolver);
    
    it("calls resolver function with two functions", function() {
        resolver.should.have.been.calledOnce;
        resolver.firstCall.args.should.have.lengthOf(2);
        resolver.firstCall.args[0].should.be.a('function');
        resolver.firstCall.args[1].should.be.a('function');
    });

    assertIsPending(sut);

    var resolve = resolver.firstCall.args[0];
    var reject = resolver.firstCall.args[1];

    when("callbacks added", function() {
        var resolveCallback = sinon.stub();
        var rejectCallback = sinon.stub();
        var result = sut.then(resolveCallback, rejectCallback);

        it("returns another promise", function() {
            result.should.be.an.instanceOf(FakePromise);
            result.should.not.equal(sut);
        });

        when("promise resolved", function() {
            var resolveValue = 'foo';
            resolve(resolveValue);

            assertIsResolved(sut);

            then("resolve callback not called", function() {
                resolveCallback.should.not.have.been.called;
            });

            when("another resolve callback added", function() {
                var resolveCallback2 = sinon.spy();
                sut.then(resolveCallback2);

                then("second resolve callback not called", function() {
                    resolveCallback2.should.not.have.been.called;
                });

                when("promises flushed", function() {
                    FakePromise.flush();

                    then("resolve callbacks called with resolve value, in order", function() {
                        resolveCallback.should.have.been.calledWith(resolveValue);
                        resolveCallback2.should.have.been.calledWith(resolveValue);
                        resolveCallback.should.have.been.calledBefore(resolveCallback2);
                    });
                });
            });

            when("promise resolved again", function() {
                resolve('bar');

                when("another resolve callback added", function() {
                    var resolveCallback2 = sinon.spy();
                    sut.then(resolveCallback2);

                    then("new resolve callback not called", function() {
                        resolveCallback2.should.not.have.been.called;
                    });

                    when("promises flushed", function() {
                        FakePromise.flush();

                        then("new resolve callback called with first resolve value", function() {
                            resolveCallback2.should.have.been.calledWith(resolveValue);
                        });
                    });
                });
            });

            when("promise rejected", function() {
                reject('bar');

                when("another pair of callbacks added", function() {
                    var resolveCallback2 = sinon.spy();
                    var rejectCallback2 = sinon.spy();
                    sut.then(resolveCallback2, rejectCallback2);

                    then("new reject callback not called", function() {
                        rejectCallback2.should.not.have.been.called;
                    });

                    when("promises flushed", function() {
                        FakePromise.flush();

                        then("new resolve callback called with first resolve value", function() {
                            resolveCallback2.should.have.been.calledWith(resolveValue);
                        });

                        then("new reject callback not called", function() {
                            rejectCallback2.should.not.have.been.called;
                        });
                    });
                });
            });
        });

        when("promise rejected", function() {
            var rejectReason = 'foo';
            reject(rejectReason);

            assertIsRejected(sut);

            then("reject callback not called", function() {
                rejectCallback.should.not.have.been.called;
            });

            when("another reject callback added", function() {
                var rejectCallback2 = sinon.spy();
                sut.then(null, rejectCallback2);

                then("second reject callback not called", function() {
                    rejectCallback2.should.not.have.been.called;
                });

                when("promises flushed", function() {
                    FakePromise.flush();

                    then("reject callbacks called with reject reason, in order", function() {
                        rejectCallback.should.have.been.calledWith(rejectReason);
                        rejectCallback2.should.have.been.calledWith(rejectReason);
                        rejectCallback.should.have.been.calledBefore(rejectCallback2);
                    });
                });
            });

            when("promise rejected again", function() {
                reject('bar');

                when("another reject callback added", function() {
                    var rejectCallback2 = sinon.spy();
                    sut.then(null, rejectCallback2);

                    then("new reject callback not called", function() {
                        rejectCallback2.should.not.have.been.called;
                    });

                    when("promises flushed", function() {
                        FakePromise.flush();

                        then("new reject callback called with original reject reason", function() {
                            rejectCallback2.should.have.been.calledWith(rejectReason);
                        });
                    });
                });
            });

            when("promise resolved", function() {
                resolve('bar');

                when("another pair of callbacks added", function() {
                    var resolveCallback2 = sinon.spy();
                    var rejectCallback2 = sinon.spy();
                    sut.then(resolveCallback2, rejectCallback2);

                    then("new resolve callback not called", function() {
                        resolveCallback2.should.not.have.been.called;
                    });

                    when("promises flushed", function() {
                        FakePromise.flush();

                        then("new resolve callback not called", function() {
                            resolveCallback2.should.not.have.been.called;
                        });

                        then("new reject callback called with original reject reason", function() {
                            rejectCallback2.should.have.been.calledWith(rejectReason);
                        });
                    });
                });
            });
        });

        when("callbacks added to second promise", function() {
            var resolveCallback2 = sinon.spy();
            var rejectCallback2 = sinon.spy();
            var result2 = result.then(resolveCallback2, rejectCallback2);
            
            when("resolve callback returns a value", function() {
                var resolveCallbackReturnValue = 'bar';
                resolveCallback.returns(resolveCallbackReturnValue);
                
                when("original promise resolved", function() {
                    resolve('foo');
                    FakePromise.flush();

                    then("second resolve callback called with return value of first resolve callback", function() {
                        resolveCallback2.should.have.been.calledWith(resolveCallbackReturnValue);
                    });
                });
            });

            when("reject callback returns a value", function() {
                var rejectCallbackReturnValue = 'bar';
                rejectCallback.returns(rejectCallbackReturnValue);

                when("original promise rejected", function() {
                    reject('foo');
                    FakePromise.flush();

                    then("second resolve callback called with return value of first reject callback", function() {
                        resolveCallback2.should.have.been.calledWith(rejectCallbackReturnValue);
                    });

                    then("second reject callback isn't called", function () {
                        rejectCallback2.should.not.have.been.called;
                    });
                });
            });

            when("resolve callback throws", function() {
                var error = new Error('foo');
                resolveCallback.throws(error);

                when("original promise resolved", function() {
                    resolve('foo');
                    FakePromise.flush();

                    then("second reject callback called with error thrown by resolve callback", function() {
                        rejectCallback2.should.have.been.calledWith(error);
                    });
                });
            });
            
            when("reject callback throws", function() {
                var error = new Error('foo');
                rejectCallback.throws(error);
                
                when("original promise rejected", function() {
                    reject('foo');
                    FakePromise.flush();
                    
                    then("second reject callback called with error thrown by first reject callback", function() {
                        rejectCallback2.should.have.been.calledWith(error);
                    });
                });
            });

            when("resolve callback returns a promise", function() {
                var resolver2 = sinon.spy();
                var resolvePromise = new FakePromise(resolver2);
                resolveCallback.returns(resolvePromise);

                when("original promise resolved", function() {
                    resolve('foo');
                    FakePromise.flush();

                    then("second resolve callback not called", function() {
                        resolveCallback2.should.not.have.been.called;
                    });

                    when("resolve promise resolved", function() {
                        var resolvePromiseResult = 'bar';
                        resolvePromise.resolve(resolvePromiseResult);
                        FakePromise.flush();

                        then("second resolve callback called with resolve promise result", function() {
                            resolveCallback2.should.have.been.calledWith(resolvePromiseResult);
                        });
                    });

                    when("resolve promise rejected", function() {
                        var resolvePromiseError = 'bar';
                        resolvePromise.reject(resolvePromiseError);
                        FakePromise.flush();

                        then("second reject callback called with resolve promise error", function() {
                            rejectCallback2.should.have.been.calledWith(resolvePromiseError);
                        });
                    });
                });
            });

            when("reject callback returns a promise", function() {
                var rejectPromise = new FakePromise(sinon.spy());
                rejectCallback.returns(rejectPromise);

                when("original promise rejected", function() {
                    reject('foo');
                    FakePromise.flush();

                    then("second reject callback not called", function() {
                        rejectCallback2.should.not.have.been.called;
                    });

                    when("reject promise resolved", function() {
                        var rejectPromiseResult = 'bar';
                        rejectPromise.resolve(rejectPromiseResult);
                        FakePromise.flush();

                        then("second resolve callback called with reject promise result", function() {
                            resolveCallback2.should.have.been.calledWith(rejectPromiseResult);
                        });
                    });

                    when("reject promise rejected", function() {
                        var rejectPromiseError = 'bar';
                        rejectPromise.reject(rejectPromiseError);
                        FakePromise.flush();

                        then("second reject callback called with resolve promise error", function() {
                            rejectCallback2.should.have.been.calledWith(rejectPromiseError);
                        });
                    });
                });
            });
        });
    });

    when("resolve callback added", function() {
        var resolveCallback = sinon.stub();
        var result = sut.then(resolveCallback);

        when("callbacks added to second promise", function () {
            var resolveCallback2 = sinon.spy();
            var rejectCallback2 = sinon.spy();
            var result2 = result.then(resolveCallback2, rejectCallback2);

            when("original promise rejected", function () {
                var rejectReason = 'foo';
                reject(rejectReason);
                FakePromise.flush();

                then("second reject callback called with reject reason", function () {
                    rejectCallback2.should.have.been.calledWith();
                });
            })
        });
    });

    when("reject callback added", function() {
        var rejectCallback = sinon.spy();
        var result = sut.catch(rejectCallback);

        it("returns another promise", function() {
            result.should.be.an.instanceOf(FakePromise);
            result.should.not.equal(sut);
        });

        when("promise resolved & promises flushed", function() {
            resolve('foo');
            FakePromise.flush();

            then("reject callback not called", function() {
                rejectCallback.should.not.have.been.called;
            });
        });

        when("promise rejected & promises flushed", function() {
            var rejectReason = 'foo';
            reject(rejectReason);
            FakePromise.flush();

            then("reject callback called with reject reason", function() {
                rejectCallback.should.have.been.calledWith(rejectReason);
            });
        });
    });
});

when("resolver function throws", function() {
    var error = new Error('foo');
    var sut = new FakePromise(function () { throw error; });

    assertRejectedWith(sut, error);
});

when("resolved promise created with nothing", function() {
    var sut = FakePromise.resolve();

    assertResolvedWith(sut, undefined);
});

when("resolved promise created a value", function() {
    var resolveValue = 'foo';
    var sut = FakePromise.resolve(resolveValue);

    assertResolvedWith(sut, resolveValue);
});

when("resolved promise created with a promise", function() {
    var promise = FakePromise.resolve();
    var sut = FakePromise.resolve(promise);

    then("the same promise is returned", function() {
        sut.should.equal(promise);
    });
});

when("resolved promise created with a thenable object", function() {
    var resolve, reject;
    var thenable = {
        then: function (resolveCallback, rejectCallback) {
            resolve = resolveCallback;
            reject = rejectCallback;
        }
    };
    var sut = FakePromise.resolve(thenable);

    then("thenable.then called", function() {
        resolve.should.be.a('function');
        reject.should.be.a('function');
    });

    when("thenable resolved", function() {
        var resolveValue = 'foo';
        resolve(resolveValue);

        assertResolvedWith(sut, resolveValue);
    });

    when("thenable rejected", function() {
        var rejectReason = 'foo';
        reject(rejectReason);

        assertRejectedWith(sut, rejectReason);
    });
});

when("rejected promise created with no reason", function() {
    var sut = FakePromise.reject();

    assertRejectedWith(sut, undefined);
});

when("rejected promise created with reason", function() {
    var rejectReason = 'foo';
    var sut = FakePromise.reject(rejectReason);

    assertRejectedWith(sut, rejectReason);
});

when("promise of all promises resolved created with values", function() {
    var resolveValues = [1, 2];
    var sut = FakePromise.all(resolveValues);

    assertIsPending(sut);

    when("promises flushed", function() {
        FakePromise.flush();

        assertIsResolved(sut);

        when("resolve callback added & promises flushed", function() {
            var resolveCallback = sinon.spy();
            sut.then(resolveCallback);
            FakePromise.flush();

            then("resolve callback called with resolve values", function() {
                resolveCallback.should.have.been.calledWith(resolveValues);
            });
        });
    });
});

when("promise of all promises resolved created with promises", function() {
    var promise1 = FakePromise.defer();
    var promise2 = FakePromise.defer();
    var sut = FakePromise.all([promise1, promise2]);

    assertIsPending(sut);

    when("all promises resolved", function() {
        promise2.resolve(2);
        promise1.resolve(1);

        assertIsPending(sut);

        when("promises flushed", function() {
            var resolveCallback = sinon.spy();
            sut.then(resolveCallback);
            FakePromise.flush();

            assertIsResolved(sut);

            then("resolve callback called with results of promises", function() {
                resolveCallback.should.have.been.calledWith([1, 2]);
            });
        });
    });
});

when("promise of first promise resolved created", function() {
    var promise1 = FakePromise.defer();
    var promise2 = FakePromise.defer();
    promise1.name = 'first promise';
    promise2.name = 'second promise';
    var sut = FakePromise.race([promise1, promise2]);

    when("second promise resolved first", function() {
        var resolveValue = 'foo';
        promise2.resolve(resolveValue);

        when("promises flushed", function() {
            FakePromise.flush();

            assertResolvedWith(sut, resolveValue);
        });
    });

    when("second promise rejected first", function() {
        var rejectReason = 'foo';
        promise2.reject(rejectReason);

        when("promises flushed", function() {
            FakePromise.flush();

            assertRejectedWith(sut, rejectReason);
        });
    });
});

var originalPromise = Promise;  // In before replace

when("replacing Promise", function() {
    FakePromise.replacePromise();

    it("replaces global Promise function", function() {
        Promise.should.equal(FakePromise);
    });

    when("Promise restored", function() {
        FakePromise.restorePromise();

        it("restores original Promise function", function() {
            Promise.should.equal(originalPromise);
        });
    });
});

function assertResolvedWith(sut, resolveValue) {
    assertIsResolved(sut);

    it("has resolve value", function() {
        expect(sut.value).to.equal(resolveValue);
    });

    when("resolve callback added & promises flushed", function() {
        var resolveCallback = sinon.spy();
        sut.then(resolveCallback);
        FakePromise.flush();

        then("resolve callback called with resolve value", function() {
            resolveCallback.should.have.been.calledWith(resolveValue);
        });
    });
}

function assertRejectedWith(sut, rejectReason) {
    assertIsRejected(sut);

    it("has reject reason", function() {
        expect(sut.error).to.equal(rejectReason);
    });

    when("reject callback added & promises flushed", function() {
        var rejectCallback = sinon.spy();
        sut.then(null, rejectCallback);
        FakePromise.flush();

        then("reject callback called with reject reason", function() {
            rejectCallback.should.have.been.calledWith(rejectReason);
        });
    });
}

function assertIsPending(promise) {
    it("is pending", function() {
        promise.isPending.should.be.true;
    });

    it("is not resolved", function() {
        promise.isResolved.should.be.false;
    });

    it("is not rejected", function() {
        promise.isRejected.should.be.false;
    });
}

function assertIsResolved(promise) {
    it("is not pending", function() {
        promise.isPending.should.be.false;
    });

    it("is resolved", function() {
        promise.isResolved.should.be.true;
    });
}

function assertIsRejected(promise) {
    it("is not pending", function() {
        promise.isPending.should.be.false;
    });

    it("is rejected", function() {
        promise.isRejected.should.be.true;
    });
}