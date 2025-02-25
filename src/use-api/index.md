# ✨ `useApi()`

---
`useApi` is a Vue 3 composable for handling API requests. It supports caching, error handling, data adaptation, and event subscriptions.

## 📌 Features
- 🚀 **Automatic Loading** — Data is fetched on the first `getRef` call.
- ⚡ **Caching** — Repeated requests with the same parameters use cached data.
- 🔄 **Cache Clearing** — Clear the entire cache or a specific request.
- 🎯 **Data Adaptation** — Pass a transformation function if needed.
- 📡 **Events** — Subscribe to `onSuccess`, `onError`, `onFinally`.

## 📜 Typing
```ts
type UseApiReturn<Data> = {
    isLoading: Ref<boolean>;
    error: Ref<unknown>;
    clear: () => void;
    clearOne: (...args: any[]) => void;
    execute: (...args: any[]) => Promise<Data>;
    load: (...args: any[]) => void;
    getRef: (defaultValue?: Data, ...args: any[]) => Ref<Data>;
    getGroupByArg: (index?: number, arg?: any) => Ref<Data[]>;
    onSuccess: SubscribeEvent<Data>;
    onError: SubscribeEvent<unknown>;
    onFinally: SubscribeEvent<void>;
};
```

## 🚀 Usage Examples

### 🔹 Simple API Request (with caching)
```ts
const fetchUsers = () => fetch('https://jsonplaceholder.typicode.com/users').then((data) => data.json());
const { getRef } = useApi(fetchUsers);
const users = getRef([]); // Data is automatically fetched
```

### 🔹 Request with Data Adaptation
```ts
const fetchUser = (id: number) => fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((data) => data.json());

const adaptUser = (user: any) => {
    return { 
        id: user.id,
        name: user.name,
        email: user.email 
    }
};

const { getRef } = useApi(fetchUser, { adapter: adaptUser });

const user = getRef(null, 1); // Ref with adapted data
```

### 🔹 Cache Clearing
```ts
const { getRef, clearOne, clear } = useApi(fetchUser);
const user = getRef(null, 2);

clearOne(2); // Removes user 2 from cache
clear(); // Clears the entire cache
```

### 🔹 Grouping Data
```ts
const getProductsPage = (page, filters) => axios.get('https://example.com/api/products', {
            params: { page, ...filters },
        }).then(({ data }) => data)

const { getGroupByArg } = useApi(getProductsPage);

execute(1, { search: 'Hello' }) // load page 1
execute(2, { search: 'Hello' }) // load page 2

const user1Posts = getGroupByArg(1, { search: 'Hello' }); // all pages from cache
```

### 🔹 Event Handling
```ts
const { execute, onSuccess, onError } = useApi(fetchUsers);

onSuccess((data) => console.log(data)); // Log success
onError((error) => console.error(error)); // Log errors

execute();
```

### 🔹 Forcing Data Reload (bypassing cache)
```ts
const { load, getRef } = useApi(fetchUser);

const user = getRef({}, 1); // First call, data fetched from API and store

load(1); // Forces a reload, ignoring the cache
```

## 📌 API Methods

### `getRef(defaultValue, ...args)` → `Ref<Data>`
Returns a reactive reference to the data. The request is executed automatically.

### `execute(...args)` → `Promise<Data>`
Forces execution of the request (using cache).

### `load(...args)`
Forces data reload (ignoring cache).

### `clear()`
Clears the entire cache.

### `clearOne(...args)`
Removes cached data for the given arguments.

### `getGroupByArg(index, arg)` → `Ref<Data[]>`
Returns an array of data grouped by the specified argument.

### `isLoading` → `Ref<boolean>`
Loading state flag.

### `error` → `Ref<unknown>`
Stores an error if the request fails.

### `onSuccess(callback)`
Triggers when the request succeeds.

### `onError(callback)`
Triggers when the request fails.

### `onFinally(callback)`
Triggers at the end of the request (always).
