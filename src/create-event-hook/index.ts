export type Handler<T = any> = (data?: T) => void;

export type SubscribeEvent<T> = (handler: Handler<T>) => void;

export type EventHook<T = any> = {
    on: SubscribeEvent<T>;
    off: SubscribeEvent<T>;
    trigger: (data?: T) => void;
};

export function createEventHook<T = any>(): EventHook<T> {
    const handlers = new Set<Handler<T>>();

    const trigger: Handler<T> = (data?: T) => {
        handlers.forEach((handler) => handler(data));
    };

    const on = (handler: Handler<T>) => {
        handlers.add(handler);
    };

    const off = (handler: Handler<T>) => {
        handlers.delete(handler);
    };

    return { trigger, on, off };
}