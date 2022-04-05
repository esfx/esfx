---
uid: '@esfx/async-barrier!AsyncBarrier:class'
example:
- *content
---

> [!NOTE]
> The following example is derived from https://docs.microsoft.com/en-us/dotnet/api/system.threading.barrier?view=net-6.0#examples

#### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage.ts)]

#### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage.js)]

***

---
uid: '@esfx/async-barrier!AsyncBarrier:class'
remarks: *content
---

An @AsyncBarrier allows you to coordinate multiple asynchronous operations that should advance from one phase to the next at the same time. Each participant
calls and awaits the result of @signalAndWait to indicate it has reached the barrier. Once all participants have arrived at the barrier, each participant 
is resumed and continue processing.

As each phase completes, the @currentPhaseNumber is incremented and any registerd post-phase action is executed prior to the participants being released.

You can use @add and @remove to change the number of expected participants during execution.