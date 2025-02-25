# ✨ `createEventHook()`

---
 A utility for managing events, allowing you to `subscribe`, `unsubscribe`, and `trigger` handlers.

## 🎯 Usage
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

## 🔹 API

```ts
export type Handler<T = any> = (data?: T) => void;

export type SubscribeEvent<T> = (handler: Handler<T>) => void;

export type EventHook<T = any> = {
    /** Subscribe to the event handler */
    on: SubscribeEvent<T>;

    /** Unsubscribe from the event handler */
    off: SubscribeEvent<T>;

    /** Trigger the event and call all subscribed handlers */
    trigger: (data?: T) => void;
};

/** Creates a new event hook instance */
export declare function createEventHook<T = any>(): EventHook<T>;
```

## 🚀 Features
- **Event Subscription** — Use `on` to subscribe to events.
- **Event Unsubscription** — Use `off` to unsubscribe from events.
- **Triggering Events** — Use `trigger` to call all subscribed handlers with the given data.
