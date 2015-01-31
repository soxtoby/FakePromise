# FakePromise
A fake Promise implementation, for testing purposes.

The main difficulty with testing native promises is that their fulfillment and rejection handlers are called asynchronously, which means your test finishes before all your code has been run. Fake promises solve this by queueing up handlers, so you can decide exactly when they are executed. They also expose their current state, making them easier to assert on.

## Usage
You can create a ```FakePromise``` directly, or replace native promises by calling ```FakePromise.replacePromise()```. Native promises can be restored with ```FakePromise.restorePromise()```.

## API
```FakePromise``` supports the same API as [native promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), with a few additions. If you've previously called ```FakePromise.replacePromise()```, you can access the static functions through ```Promise``` as well as ```FakePromise```.

### FakePromise.flush()
Runs any pending fulfillment or rejection handlers. If they add more handlers to the queue, those will be run as well.

### FakePromise.clear()
Clears the queue of pending handlers, so that they won't be run during the next ```flush()```.

### FakePromise.defer()
Creates a new ```FakePromise``` that must be ```resolve```d or ```rejected``` manually.

### FakePromise.replacePromise()
Replaces the ```Promise``` constructor with ```FakePromise```, so any code creating ```Promise```s will create fakes instead.

### FakePromise.restorePromise()
Sets ```Promise``` back to the native implementation.

### #resolve(value)
Resolves the promise with the given (optional) value.

### #reject(error)
Rejects the promise with the given (optional) error.

### #value
Returns the value that the promise was resolved with, if it was resolved.

### #error
Returns the error that the promise was rejected with, if it was rejected.

### #isPending
True if the promise has been neither resolved nor rejected.

### #isResolved
True if the promise has been resolved.

### #isRejected
True if the promise has been rejected.
