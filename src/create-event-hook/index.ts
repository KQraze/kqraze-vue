type Handler = <T>(data?: T) => void

export function createEventHook() {
    const handlers = new Set()

    const trigger: Handler = <T>(data?: T) => handlers.forEach((handler: any)=> handler(data))

    const on = (handler) => handlers.add(handler)
    const off = (handler) => handler.delete(handler)

    return { trigger, on, off }
}