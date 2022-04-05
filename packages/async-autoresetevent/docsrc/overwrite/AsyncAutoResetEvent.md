---
uid: '@esfx/async-autoresetevent!AsyncAutoResetEvent:class'
example:
- *content
---

The following example shows how to use @AsyncAutoResetEvent to release one asynchronous operation at a time whenever the user presses **Enter**.
Because the first event is initially signaled, the first operation is released immediately. This resets the signaled state, causing the remaining operations to pause until the event is once again signaled.

> [!NOTE]
> The following example is derived from https://docs.microsoft.com/en-us/dotnet/api/system.threading.autoresetevent?view=net-6.0#examples

#### [TypeScript](#tab/ts)
[!code[](../examples/AsyncAutoResetEvent.ts)]

#### [JavaScript (CommonJS)](#tab/js)
[!code[](../examples/AsyncAutoResetEvent.js)]

***

---
uid: '@esfx/async-autoresetevent!AsyncAutoResetEvent:class'
remarks: *content
---

The @AsyncAutoResetEvent and @"@esfx/async-manualresetevent!AsyncManualResetEvent:class" classes are used to provide signaling between concurrent asynchronous operations.

An asynchronous operation can wait until an event is signaled by awaiting the result of @wait. This causes the operation to pause until the event
becomes signaled. Calling @set will signal and release a single waiting operation, immediately returning the event to the non-signaled state. If 
there are no operations currently waiting on the event, the event will remain signaled until the next call to @wait.

Calling @reset resets the event to the non-signaled state.
