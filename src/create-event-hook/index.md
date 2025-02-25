# ✨ createEventHook()
> A utility for managing events, allowing you to `subscribe`, `unsubscribe` and `trigger` handlers.

## 🎯 Usage
```ts
import { createEventHook } from '@kqraze/vue'

const messageHook = createEventHook<string>();

// subscribe to the event
messageHook.on((message) => {
    console.log("Message received:", message);
});

// call the event
messageHook.trigger("Hello world!"); // The console will be displayed: Message receved: Hello World!
```

## 🔹 API

```ts
export type Handler<T = any> = (data?: T) => void;

export type SubscribeEvent<T> = (handler: Handler<T>) => void;

export type EventHook<T = any> = {
    on: SubscribeEvent<T>;
    off: SubscribeEvent<T>;
    trigger: (data?: T) => void;
};

export declare function createEventHook<T = any>(): EventHook<T>;
```