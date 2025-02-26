import { Ref, ref, watch, onUnmounted } from "vue";

export interface UseAwaitingEventReturn {
    /**
     * A reactive boolean that indicates whether the operation is currently in progress.
     * `true` when the execution is running, and `false` when it is idle.
     */
    isWaiting: Ref<boolean>;

    /**
     * A reactive number representing the timeout duration (in milliseconds) for the execution.
     * Can be dynamically updated to change the waiting time.
     */
    timeout: Ref<number>;

    /**
     * Executes the waiting operation with a specified timeout.
     * Resolves with the provided data after the timeout has elapsed.
     *
     * @param data - Optional data to be returned when the execution completes.
     * @returns A promise that resolves with the provided data after the waiting period.
     */
    execute: <T>(data?: T) => Promise<T>;

    /**
     * Cancels the ongoing execution if it is in progress.
     * Clears the timeout and resets the waiting state.
     */
    cancel: () => void;
}

export const useAwaitingEvent = (initialTimeout: number = 1000): UseAwaitingEventReturn => {
    const isWaiting = ref(false);
    const timeout = ref(initialTimeout);
    const timer = ref<ReturnType<typeof setTimeout>>();

    const execute = <T>(data?: T): Promise<T> => {
        if (isWaiting.value) return Promise.reject(new Error("The operation is already performed"));

        isWaiting.value = true;

        return new Promise<T>((resolve, reject) => {
            timer.value = setTimeout(() => {
                isWaiting.value = false;
                resolve(data as T);
            }, timeout.value);

            watch(timeout, () => {
                if (timer) {
                    clearTimeout(timer.value);
                    reject(new Error("The timer is canceled due to a change in delay"));
                }
            });

            watch(timer, () => {
                reject(new Error("The timer is canceled forcibly"))
            })
        });
    };

    const cancel = () => {
        if (timer) {
            clearTimeout(timer.value);
            isWaiting.value = false;
            timer.value = undefined;
        }
    };

    return {
        isWaiting,
        execute,
        cancel,
        timeout,
    };
};