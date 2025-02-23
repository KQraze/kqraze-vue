import { computed, ref, shallowRef, watchEffect } from 'vue'

const createHook = () => {
    const handlers = new Set()

    const trigger = <T>(data?: T) => handlers.forEach((handler) => handler(data))

    const on = (handler) => handlers.add(handler)
    const off = (handler) => handler.delete(handler)

    return { trigger, on, off }
}

export function useApi(request, adapter) {
    const isLoading = ref(false)
    const error = ref(null)

    const successHook = createHook()
    const errorHook = createHook()
    const finallyHook = createHook()

    const cache = ref(new Map())
    const triggerRef = ref(0)

    const execute = async (ignoreCache = false, ...args) => {
        const cacheKey = JSON.stringify(args)

        if (!ignoreCache && cache.value.has(cacheKey)) {
            return cache.value.get(cacheKey)
        }

        isLoading.value = true
        error.value = null

        try {
            const response = await request(...args)
            const adaptedData = adapter ? adapter(response) : response
            cache.value.set(cacheKey, adaptedData)

            successHook.trigger(adaptedData)

            return adaptedData
        } catch (err) {
            error.value = err

            errorHook.trigger(err)

            throw err
        } finally {
            isLoading.value = false

            finallyHook.trigger()
        }
    }

    const load = (...args) => {
        execute(true, ...args).then(() => triggerRef.value++)
    }

    const clearOne = (...args) => {
        const cacheKey = JSON.stringify(args)
        cache.value.delete(cacheKey)
    }

    const clear = () => {
        cache.value.clear()
    }

    const getRef = (defaultValue = null, ...args) => {
        const result = shallowRef(defaultValue)

        watchEffect(async () => {
            triggerRef.value
            try {
                result.value = await execute(false, ...args)
            } catch {
                result.value = defaultValue
            }
        })

        return result
    }

    const getGroupByArg = (index = -1, value = null) => {
        return computed(() => {
            const data = []

            for (const key of cache.value.keys()) {
                if (index === -1) data.push(cache.value.get(key))
                else {
                    let args = JSON.parse(key)

                    if (args[index] && JSON.stringify(args[index]) === JSON.stringify(value)) {
                        data.push(cache.value.get(key))
                    }
                }
            }

            return data
        })
    }

    return {
        getRef,
        getGroupByArg,
        clear,
        clearOne,
        load,
        execute: (...args) => execute(false, ...args),
        onFinally: finallyHook.on,
        onSuccess: successHook.on,
        onError: errorHook.on,
        error,
        isLoading,
    }
}
