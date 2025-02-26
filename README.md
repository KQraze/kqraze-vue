# @kqraze/vue

---
#### ⚡ A set of functions, methods, and hooks for Vue 3 written with strict TypeScript typing.

## 💎 Installation

To install the library, use the following command:

```bash
npm install -D @kqraze/vue
```

## ✅ Active Functions List

>🔹 **[useApi()](https://github.com/KQraze/kqraze-vue/tree/main/src/use-api/index.md)**  
  A composable for handling API requests with caching, state management, and data adaptation.

>🔹 **[createEventHook()](https://github.com/KQraze/kqraze-vue/blob/main/src/create-event-hook/index.md)**  
  A utility for managing events, allowing you to subscribe, unsubscribe, and trigger handlers.

>🔹 **[useAwaitingEvent()](https://github.com/KQraze/kqraze-vue/blob/main/src/use-awaiting-event/index.md)**  
A composable utility for managing delayed execution with a waiting state. It allows you to execute an event with a specified timeout, track its progress, cancel it, and dynamically update the timeout.
## 🎯 Usage

Here's an example of how to use `createEventHook()`:

```ts
import { createEventHook } from '@kqraze/vue'

const messageHook = createEventHook<string>();

// Subscribe to the event
messageHook.on((message) => {
    console.log("Message received:", message);
});

// Trigger the event
messageHook.trigger("Hello world!"); // The console will display: Message received: Hello world!
```