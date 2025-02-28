import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {useApi} from "./index";
import {useAwaitingEvent, UseAwaitingEventReturn, deepClone} from "..";
import {nextTick} from "vue";
import {flushPromises} from "@vue/test-utils";

interface User {
    id?: number;
    name?: string;
    age?: number;
}

const originalUsers: User[] = [
    { id: 1, name: 'Daniel', age: 18 },
    { id: 2, name: 'Alex', age: 20 },
    { id: 3, name: 'Vanya', age: 22 },
]
let users: User[];

describe('useApi testing', () => {
    let awaitingEvent: UseAwaitingEventReturn;

    const getUsers = () => awaitingEvent.execute(deepClone(users));
    const getUser = (id: number) => awaitingEvent.execute(users.find((user) => user.id === id))
    const createUser = ({ name, age }: User) => awaitingEvent.execute(users.push({ id: users.length + 1, name, age }))

    beforeEach(() => {
        users = deepClone(originalUsers);

        vi.useFakeTimers();
        awaitingEvent = useAwaitingEvent(1000);

        vi.spyOn(awaitingEvent, 'execute').mockImplementation((value) => {
            return Promise.resolve(value);
        });
    })

    it('getRef without args', async () => {
        const { getRef } = useApi(getUsers);
        const refResponse = getRef();

        await flushPromises();
        await nextTick();

        expect(refResponse.value).toEqual(users);
    })

    it('getRef with args', async () => {
        const { getRef } = useApi(getUser);
        const refResponse = getRef({}, 1);

        await flushPromises();
        await nextTick();

        expect(refResponse.value).toEqual(users.find((user) => user.id === 1));
    })

    it('getRef should update if load called', async () => {
        const { getRef, load: loadUsers } = useApi(getUsers);
        const { load: addUser } = useApi(createUser)

        const refResponse = getRef()
        await flushPromises();
        await nextTick();

        expect(refResponse.value).toEqual(originalUsers);

        await addUser({ name: 'Petya', age: 17 })

        await flushPromises();
        await nextTick();

        expect(refResponse.value).toEqual(originalUsers);

        await loadUsers()

        await flushPromises();
        await nextTick();

        expect(refResponse.value).toEqual(users);
    });


    it('getGroupByArg without arg. Testing cache clear', async () => {
        const { execute, getGroupByArg, clear, clearOne } = useApi(getUser);

        await Promise.allSettled([execute(1), execute(2), execute(3)]);
        await flushPromises();
        await nextTick();

        const refResponse = getGroupByArg();

        expect(refResponse.value).toEqual([
            users.find((user) => user.id === 1),
            users.find((user) => user.id === 2),
            users.find((user) => user.id === 3),
        ]);

        clearOne(2);

        expect(refResponse.value).toEqual([
            users.find((user) => user.id === 1),
            users.find((user) => user.id === 3),
        ]);

        clear();

        expect(refResponse.value).toEqual([])
    });

    afterEach(() => {
        vi.useRealTimers();
    })
})