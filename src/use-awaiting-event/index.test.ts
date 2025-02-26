import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAwaitingEvent, UseAwaitingEventReturn } from "./index";

describe("useAwaitingEvent", () => {
    let awaitingEvent: UseAwaitingEventReturn;

    beforeEach(() => {
        vi.useFakeTimers();
        awaitingEvent = useAwaitingEvent(1000);
    });

    it("execute() returns provided data after timeout", async () => {
        const resultPromise = awaitingEvent.execute("Test Data");

        expect(awaitingEvent.isWaiting.value).toBe(true);

        vi.advanceTimersByTime(1000);
        const result = await resultPromise;

        expect(result).toBe("Test Data");
        expect(awaitingEvent.isWaiting.value).toBe(false);
    });

    it("isWaiting updates correctly", async () => {
        expect(awaitingEvent.isWaiting.value).toBe(false);

        const resultPromise = awaitingEvent.execute();
        expect(awaitingEvent.isWaiting.value).toBe(true);

        vi.advanceTimersByTime(1000);
        await resultPromise;

        expect(awaitingEvent.isWaiting.value).toBe(false);
    });

    it("cancel() stops execution", async () => {
        const resultPromise = awaitingEvent.execute("Should not complete");

        expect(awaitingEvent.isWaiting.value).toBe(true);
        awaitingEvent.cancel();

        expect(awaitingEvent.isWaiting.value).toBe(false);

        vi.advanceTimersByTime(1000);
        await expect(resultPromise).rejects.toThrow();
    });

    it("execute() does not start if already running", async () => {
        awaitingEvent.execute().then();
        expect(awaitingEvent.isWaiting.value).toBe(true);

        await expect(awaitingEvent.execute()).rejects.toThrow("The operation is already performed");
    });

    it("timeout can be updated dynamically", () => {
        expect(awaitingEvent.timeout.value).toBe(1000);

        awaitingEvent.timeout.value = 2000;
        expect(awaitingEvent.timeout.value).toBe(2000);
    });

    afterEach(() => {
        vi.useRealTimers();
    });
});
