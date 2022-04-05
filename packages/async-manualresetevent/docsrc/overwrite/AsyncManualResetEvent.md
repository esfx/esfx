---
uid: '@esfx/async-manualresetevent!AsyncManualResetEvent:class'
example:
- *content
---

The following example shows how to use @AsyncManualResetEvent to release asynchronous operations. In this demonstration,
we start three asynchronous operations that pause when awaiting the result of @wait because the event is unsignaled.
After pressing **Enter**, the event becomes signaled and all three operations can continue. 

Pressing **Enter** again then demonstrates that two more asynchronous operations won't pause when awaiting the result of 
@wait because the event is now unsignaled.

Pressing **Enter** a third time calls @reset on the event and demonstrates that a new asynchronous operation will once
again pause when awaiting the result of @wait now that the event has become signaled.

Pressing **Enter** a fourth and final time calls @set to signal the event and allow the final operation to conclude.

> [!NOTE]
> The following example is derived from https://docs.microsoft.com/en-us/dotnet/api/system.threading.manualresetevent?view=net-6.0#examples

#### [TypeScript](#tab/ts)
[!code[](../examples/AsyncManualResetEvent.ts)]

#### [JavaScript (CommonJS)](#tab/js)
[!code[](../examples/AsyncManualResetEvent.js)]

***

---
uid: '@esfx/async-manualresetevent!AsyncManualResetEvent:class'
remarks: *content
---

The @"@esfx/async-autoresetevent!AsyncAutoResetEvent:class" and @AsyncManualResetEvent classes are used to provide signaling between concurrent asynchronous operations.

An asynchronous operation can wait until an event is signaled by awaiting the result of @wait. This causes the operation to pause until the event
becomes signaled. Calling @set will signal and release all waiting operations. The event will remain in the signaled state until @reset is called,
which resets the event to the non-signaled state.

You can use @isSet to check whether the event is currently signaled to avoid calling @wait (and avoid the `await` that entails).