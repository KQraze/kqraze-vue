import { computed, ref, shallowRef, watchEffect, Ref } from 'vue';
import { createEventHook, SubscribeEvent } from '../create-event-hook';

/**
 * Function type for adapting API response data.
 * @template Result - The original response type from the API.
 * @template AdaptedResult - The transformed type after applying the adapter function.
 */
export type AdapterFunction<Result, AdaptedResult> = (response: Result) => AdaptedResult;

/**
 * The return type of the useApi composable.
 * @template Data - The type of the data returned from the API (adapted or raw).
 */
export type UseApiReturn<Data, Args extends any[] = any[]> = {
    /** Indicates whether the API request is in progress. */
    isLoading: Ref<boolean>;

    /** Stores an error if the API request fails. */
    error: Ref<unknown>;

    /** Clears the entire cache of stored API responses. */
    clear: () => void;

    /** Removes a specific cached response based on provided arguments. */
    clearOne: (...args: Args) => void;

    /** Executes the API request and returns the data. Uses caching unless explicitly bypassed. */
    execute: (...args: Args) => Promise<Data>;

    /** Forces a reload of data without using cache. */
    load: (...args: Args) => Promise<Data>;

    /**
     * Returns a reactive reference to the API response data.
     * @param defaultValue - The initial value before the request completes.
     * @param args - Arguments used for fetching the data.
     */
    getRef: (defaultValue?: Data, ...args: Args) => Ref<Data>;

    /**
     * Retrieves a reactive array of results grouped by a specific argument.
     * @param index - The position of the argument to filter by.
     * @param arg - The value to match against in the argument list.
     */
    getGroupByArg: (index?: number, arg?: any) => Ref<Data[]>;

    /** Event triggered when a request succeeds. */
    onSuccess: SubscribeEvent<Data>;

    /** Event triggered when a request fails. */
    onError: SubscribeEvent<unknown>;

    /** Event triggered when a request completes, regardless of success or failure. */
    onFinally: SubscribeEvent<void>;
};

/**
 * Composable for handling API requests with caching, state management, and optional data adaptation.
 * @template Result - The original API response type.
 * @param request - A function that returns a Promise resolving to API data.
 * @param options
 */
export function useApi<Result, Args extends any[] = any[]>(
    request: (...args: Args) => Promise<Result>,
    options?: { adapter?: undefined }
): UseApiReturn<Result, Args>;


/**
 * Overload for useApi when an adapter function is provided.
 * @template Result - The original API response type.
 * @template AdaptedResult - The transformed type after applying the adapter function.
 */
export function useApi<Result, AdaptedResult, Args extends any[] = any[]>(
    request: (...args: Args) => Promise<Result>,
    options: { adapter: AdapterFunction<Result, AdaptedResult> }
): UseApiReturn<AdaptedResult, Args>;

/**
 * Implementation of the useApi composable.
 */
export function useApi<Result, AdaptedResult = Result, Args extends any[] = any[]>(
    request: (...args: Args) => Promise<Result>,
    options?: { adapter?: AdapterFunction<Result, AdaptedResult> }
): UseApiReturn<AdaptedResult extends Result ? Result : AdaptedResult, Args> {
    type Data = AdaptedResult extends Result ? Result : AdaptedResult;

    const isLoading: Ref<boolean> = ref(false);
    const error: Ref<unknown> = ref(null);
    const triggerRef: Ref<number> = ref(0);
    const cache: Ref<Map<string, Data>> = ref(new Map());

    const successHook = createEventHook<Data>();
    const errorHook = createEventHook<unknown>();
    const finallyHook = createEventHook<void>();

    const execute = async (ignoreCache = false, ...args: Args): Promise<Data> => {
        const cacheKey = JSON.stringify(args);
        if (!ignoreCache && cache.value.has(cacheKey)) {
            return cache.value.get(cacheKey)!;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const response = await request(...args);
            const adaptedData = options?.adapter
                ? options.adapter(response) as Data
                : (response as unknown as Data);

            cache.value.set(cacheKey, adaptedData);
            successHook.trigger(adaptedData);

            return adaptedData;
        } catch (err: unknown) {
            error.value = err;
            errorHook.trigger(err);
            throw err;
        } finally {
            isLoading.value = false;
            finallyHook.trigger();
        }
    };

    const getRef = (defaultValue?: Data, ...args: Args): Ref<Data> => {
        const result = shallowRef<Data>(defaultValue as Data) as Ref<Data>;
        watchEffect(async () => {
            triggerRef.value;
            try {
                result.value = await execute(false, ...args);
            } catch {
                result.value = defaultValue as Data;
            }
        });
        return result;
    };

    const getGroupByArg = (index: number = -1, arg?: any): Ref<Data[]> => {
        return computed(() => {
            return [...cache.value.entries()]
                .filter(([key]) => index === -1 || JSON.stringify(JSON.parse(key)[index]) === JSON.stringify(arg))
                .map(([, value]) => value);
        });
    };

    return {
        getRef,
        getGroupByArg,
        clear: () => cache.value.clear(),
        clearOne: (...args: any[]) => cache.value.delete(JSON.stringify(args)),
        load: (...args: Args) => execute(true, ...args).then((data) => {
            triggerRef.value++

            return data;
        }),
        execute: (...args: Args) => execute(false, ...args),
        onFinally: finallyHook.on,
        onSuccess: successHook.on,
        onError: errorHook.on,
        error,
        isLoading,
    };
}