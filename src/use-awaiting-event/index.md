# ✨ `useAwaitingEvent()`

---  
A composable utility for managing delayed execution with a waiting state. It allows you to execute an event with a specified timeout, track its progress, cancel it, and dynamically update the timeout.

## 🎯 **Usage**

```ts
import { useAwaitingEvent } from "@kqraze/vue";

const { isWaiting, execute, cancel, timeout } = useAwaitingEvent(2000);

// Execute an event with a delay
execute("Hello world!").then((message) => {
  console.log("Event completed:", message);
});

// Cancel the execution before it completes
cancel();
```

## 🔹 **API**

```ts
export interface UseAwaitingEventReturn {
  /** Reactive state indicating whether execution is in progress */
  isWaiting: Ref<boolean>;

  /** Reactive timeout duration in milliseconds */
  timeout: Ref<number>;

  /** 
   * Executes the waiting event with the specified timeout.
   * @param data - Optional data to be returned when the execution completes.
   * @returns A promise resolving with the provided data after the waiting period.
   */
  execute: <T>(data?: T) => Promise<T>;

  /** Cancels the execution, resetting the waiting state */
  cancel: () => void;
}

/** Creates an instance of useAwaitingEvent with a specified timeout */
export declare function useAwaitingEvent(timeout?: number): UseAwaitingEventReturn;
```

## 🚀 **Features**
- **Execution with Delay** — Use `execute` to start an event with a timeout.
- **State Tracking** — The `isWaiting` ref updates automatically.
- **Cancelable Execution** — Call `cancel` to stop the event before completion.
- **Dynamic Timeout** — Update `timeout` to modify the delay in real time.

