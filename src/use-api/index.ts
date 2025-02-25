import {computed, ref, shallowRef, watchEffect, Ref} from 'vue';
import {createEventHook, SubscribeEvent} from '../create-event-hook';

/**
 * A function that adapts the raw response from the API into a different shape or structure.
 * @param response - The raw response from the API.
 * @returns The adapted response.
 */
export type AdapterFunction<Result, AdaptedResult> = (response: Result) => AdaptedResult;

/**
 * Determines the data type returned by `useApi` based on the provided options.
 *
 * If an `adapter` function is provided in `UseApiOptions`, the result will be of type `AdaptedResult`.
 * Otherwise, it will be of type `Result | null`.
 */
export type UseApiData<Result, AdaptedResult> = Result | AdaptedResult;


export interface UseApiOptions {}
/**
 * Configuration options for the `useApi` composable.
 * @property adapter - An optional adapter function to transform the raw API response.
 */
export interface UseApiOptions<Result, AdaptedResult> {
    /**
     * `adapter` - An optional function to adapt the raw API response into a different structure.
     * */
    adapter: AdapterFunction<Result, AdaptedResult>;
}

/**
 * The return type of the `useApi` composable.
 * Provides methods and properties to interact with the API, manage cache, and handle events.
 */
export interface UseApiReturn<Result> {
    /**
     * Indicates whether the request is currently in progress.
     */
    isLoading: Ref<boolean>;
    /**
     * Stores the error from the server, updated on each `execute` call.
     */
    error: Ref<Error | null>;
    /**
     * Clears all cached data for the API.
     */
    clear: () => void;
    /**
     * Clears the cache for a specific set of arguments.
     * @param args - The arguments used as the cache key.
     */
    clearOne: (...args: any[]) => void;
    /**
     * Executes the API request and caches the result.
     *
     * If the result is already cached, it returns the cached value without making a new request.
     *
     * @param args - The arguments to pass to the API request.
     * @returns The result of the API request, either raw or adapted.
     */
    execute: (...args: any[]) => Promise<Result>;
    /**
     * Executes the API request, ignoring the cache.
     *
     * If a cache entry exists for the given arguments, it updates the cache with the new result.
     *
     * @param args - The arguments to pass to the API request.
     */
    load: (...args: any[]) => void;
    /**
     * Returns a reactive reference to the API result.
     *
     * Automatically updates when the cache or arguments change.
     *
     * @param defaultValue - The default value to return if the request fails or is pending.
     * @param args - The arguments to pass to the API request.
     * @returns A reactive reference to the API result.
     */
    getRef: (defaultValue?: Result, ...args: any[]) => Ref<Result>;
    /**
     * Groups cached results by a specific argument index.
     * @param index - The index of the argument to group by. If `-1`, groups all results.
     * @param arg - The value of the argument to filter by.
     * @returns A reactive reference to the grouped results.
     */
    getGroupByArg: (index?: number, arg?: any) => Ref<Result[]>;
    /**
     * Subscribes to the success event, triggered when a request completes successfully.
     */
    onSuccess: SubscribeEvent<Result>;
    /**
     * Subscribes to the error event, triggered when a request fails.
     */
    onError: SubscribeEvent<Error | null>;
    /**
     * Subscribes to the finally event, triggered when a request completes (regardless of success or failure).
     */
    onFinally: SubscribeEvent<void>;
}


export function useApi<Result>(
    request: (...args: any[]) => Promise<Result>,
    options: UseApiOptions
): UseApiReturn<Result>;

export function useApi<Result, AdaptedResult = Result>(
    request: (...args: any[]) => Promise<Result>,
    options: UseApiOptions<Result, AdaptedResult>
): UseApiReturn<AdaptedResult>;

/**
 * A composable function to handle API requests with caching, adapters, and event hooks.
 * @param request - The function that performs the API request.
 * @param options - Optional configuration, including an adapter function.
 * @returns An object with methods and properties to interact with the API.
 */
export function useApi<Result, AdaptedResult = Result>(
    request: (...args: any[]) => Promise<Result>,
    options?: UseApiOptions,
): UseApiReturn<AdaptedResult>;  {

    type Data = UseApiData<Result, AdaptedResult>;

    const isLoading: Ref<boolean> = ref(false);
    const error: Ref<Error | null> = ref(null);
    const triggerRef: Ref<number> = ref(0);

    const cache: Ref<Map<string, Data>> = ref(new Map());

    const successHook = createEventHook<Data>();
    const errorHook = createEventHook<Error>();
    const finallyHook = createEventHook<void>();

    const execute = async (ignoreCache = false, ...args: any[]): Promise<Data> => {
        const cacheKey = JSON.stringify(args);

        if (!ignoreCache && cache.value.has(cacheKey)) {
            return cache.value.get(cacheKey)!;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const response = await request(...args);
            const adaptedData = options?.adapter ? options.adapter(response) : (response as unknown as Result);

            cache.value.set(cacheKey, adaptedData as Data);

            successHook.trigger(adaptedData as Data);

            return adaptedData as Data;
        } catch (err: any) {
            error.value = err;

            errorHook.trigger(err);

            throw err;
        } finally {
            isLoading.value = false;

            finallyHook.trigger();
        }
    };

    const getRef = (defaultValue: Data = null, ...args: any[]): Ref<Data> => {
        const result = shallowRef<Data>(defaultValue);

        watchEffect(async () => {
            triggerRef.value;
            try {
                result.value = await execute(false, ...args);
            } catch {
                result.value = defaultValue;
            }
        });

        return result;
    };

    const getGroupByArg = (index: number = -1, arg: any = null): Ref<Data[]> => {
        return computed(() => {
            const data: Data[] = [];

            for (const key of cache.value.keys()) {
                if (index === -1) data.push(cache.value.get(key)!);
                else {
                    let args = JSON.parse(key);

                    if (args[index] && JSON.stringify(args[index]) === JSON.stringify(arg)) {
                        data.push(cache.value.get(key)!);
                    }
                }
            }

            return data;
        });
    };

    return {
        getRef,
        getGroupByArg,
        clear: () => cache.value.clear(),
        clearOne: (...args: any[]) => cache.value.delete(JSON.stringify(args)),
        load: (...args: any[]) => execute(true, ...args).then(() => triggerRef.value++),
        execute: (...args: any[]) => execute(false, ...args),
        onFinally: finallyHook.on,
        onSuccess: successHook.on,
        onError: errorHook.on,
        error,
        isLoading,
    };
}

interface Product {
    id: number
}

interface AdaptedProduct {
    id: number
}


const { getRef } = useApi((): Promise<Product> => fetch('http://localhost:8080').then((res) => res.json()), {
    adapter: (response): AdaptedProduct => ({ id: response.id } )
});

const data = getRef();

data.value