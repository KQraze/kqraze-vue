import {computed, ref, shallowRef, watchEffect, Ref, ComputedRef} from 'vue';
import { createEventHook, SubscribeEvent } from '../create-event-hook';

/**
 * Options for the useApi composable.
 * @template Result - The original type of the API response.
 * @template AdaptedResult - The type of the response after adaptation.
 * @template AdaptedError - The type of the error after adaptation.
 */
type UseApiOptions<Result, AdaptedResult, AdaptedError> = {
    /**
     * Function to adapt the API response.
     * @param response - The original API response.
     * @returns The adapted response.
     */
    adapter?: (response: Result) => AdaptedResult;

    /**
     * Function to adapt the error.
     * @param error - The original error.
     * @returns The adapted error.
     */
    errorAdapter?: (error: unknown) => AdaptedError;

    /**
     * Cache duration in seconds.
     * If provided, the cached data will be considered valid for this duration.
     */
    cacheTime?: number;
};

/**
 * Return type of the useApi composable.
 * @template Data - The type of the data returned from the API (adapted or raw).
 * @template ErrorT - The type of the error (adapted or raw).
 * @template Args - The type of the arguments passed to the API request.
 */
type UseApiReturn<Data, ErrorT = unknown, Args extends any[] = any[]> = {
    /**
     * Indicates if the API request is in progress.
     */
    isLoading: Ref<boolean>;

    /**
     * Stores the error if the API request fails.
     */
    error: Ref<ErrorT>;

    /**
     * Clears the entire cache.
     */
    clear: () => void;

    /**
     * Clears a specific cached response based on the provided arguments.
     * @param args - The arguments used to identify the cached response.
     */
    clearOne: (...args: Args) => void;

    /**
     * Executes the API request and returns the data. Uses caching unless explicitly bypassed.
     * @param args - The arguments passed to the API request.
     * @returns A Promise resolving to the API data.
     */
    execute: (...args: Args) => Promise<Data>;

    /**
     * Forces a reload of data without using the cache.
     * @param args - The arguments passed to the API request.
     * @returns A Promise resolving to the API data.
     */
    load: (...args: Args) => Promise<Data>;

    /**
     * Returns a reactive reference to the API response data.
     * @param defaultValue - The initial value before the request completes.
     * @param args - The arguments passed to the API request.
     * @returns A reactive reference to the API data.
     */
    getRef: (defaultValue?: Data, ...args: Args) => Ref<Data>;

    /**
     * Retrieves a reactive array of results grouped by a specific argument.
     * @param index - The position of the argument to filter by.
     * @param arg - The value to match against in the argument list.
     * @returns A reactive reference to the grouped results.
     */
    getGroupByArg: <I extends keyof Args>(index?: I, arg?: Args[I]) => ComputedRef<Data[]>;

    /**
     * Event triggered when a request succeeds.
     */
    onSuccess: SubscribeEvent<Data>;

    /**
     * Event triggered when a request fails.
     */
    onError: SubscribeEvent<ErrorT>;

    /**
     * Event triggered when a request completes, regardless of success or failure.
     */
    onFinally: SubscribeEvent<void>;
};

/**
 * Composable for handling API requests with caching, state management, and optional data adaptation.
 * @template Result - The original API response type.
 * @template AdaptedResult - The transformed type after applying the adapter function.
 * @template AdaptedError - The transformed type after applying the error adapter function.
 * @template Args - The type of the arguments passed to the API request.
 * @param {(...args: Args) => Promise<Result>} request
 * @param {UseApiOptions<Result, AdaptedResult, AdaptedError>} [options] - Опции
 * @returns {UseApiReturn<Result, AdaptedError, Args>}
 */
export function useApi<Result, AdaptedResult = Result, AdaptedError = unknown, Args extends any[] = any[]>(
    request: (...args: Args) => Promise<Result>,
    options?: UseApiOptions<Result, AdaptedResult, AdaptedError>
): UseApiReturn<{ fetchedAt?: Date } & (AdaptedResult extends Result ? Result : AdaptedResult), AdaptedError, Args> {

    type Data = { fetchedAt?: Date } & (AdaptedResult extends Result ? Result : AdaptedResult);

    const successHook = createEventHook<Data>();
    const errorHook = createEventHook<AdaptedError>();
    const finallyHook = createEventHook<void>();

    const isLoading = ref(false);
    const error = ref<AdaptedError | null>(null);
    const triggerRef = ref(0);
    const cache: Ref<Map<string, Data>> = ref(new Map());

    const execute = async (ignoreCache = false, ...args: Args): Promise<Data> => {
        const cacheKey = JSON.stringify(args);

        if (!ignoreCache && cache.value.has(cacheKey)) {
            let isExpired = false;

            const data = cache.value.get(cacheKey)!;

            if (data.fetchedAt && options?.cacheTime) {
                const expirationDate = new Date(data.fetchedAt);
                expirationDate.setTime(expirationDate.getTime() + options.cacheTime * 1000);
                isExpired = expirationDate.getTime() < Date.now();
            }

            if (!isExpired) return data;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const response = await request(...args);

            let adaptedData = options?.adapter ? options.adapter(response) as Data : response as Data;

            adaptedData = options?.cacheTime
                ? {...adaptedData, fetchedAt: new Date() }
                : adaptedData;

            cache.value.set(cacheKey, adaptedData);
            successHook.trigger(adaptedData);

            triggerRef.value++;

            return adaptedData;
        } catch (err) {
            const adaptedError = options?.errorAdapter ? options.errorAdapter(err) as AdaptedError : err as AdaptedError;

            error.value = adaptedError;
            errorHook.trigger(adaptedError);

            throw adaptedError;
        } finally {
            isLoading.value = false;
            finallyHook.trigger();
        }
    };

    const getRef = (defaultValue?: Data, ...args: Args): Ref<Data> => {
        const result = shallowRef<Data | undefined>(defaultValue);

        watchEffect(async () => {
            triggerRef.value;
            try {
                result.value = await execute(false, ...args);
            } catch {
                result.value = defaultValue;
            }
        });

        return result as Ref<Data>;
    };

    const getGroupByArg = <I extends keyof Args>(index?: I, arg?: Args[I]): ComputedRef<Data[]> => {
        return computed(() => [...cache.value.entries()]
            .filter(([key]) => index === undefined || JSON.stringify(JSON.parse(key)[index]) === JSON.stringify(arg))
            .map(([, value]) => value));
    };

    return {
        isLoading,
        error: error as Ref<AdaptedError>,
        clear: () => cache.value.clear(),
        clearOne: (...args: Args) => cache.value.delete(JSON.stringify(args)),
        execute: (...args: Args) => execute(false, ...args),
        load: (...args: Args) => execute(true, ...args),
        getRef,
        getGroupByArg,
        onSuccess: successHook.on,
        onError: errorHook.on,
        onFinally: finallyHook.on,
    };
}