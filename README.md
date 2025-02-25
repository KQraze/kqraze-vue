# @kqraze/vue

#### ⚡ A set of functions, Methods and Hooks for Vue 3 written with strict typing Typescript.

## 💎 Install
```bash
npm install -D @kqraze/vue
```

## ✅ Active functions list:

- ###  [useApi()](https://github.com/KQraze/kqraze-vue/tree/main/src/use-api)
- ###  [createEventHook()]()

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