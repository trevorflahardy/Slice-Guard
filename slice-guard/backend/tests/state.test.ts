import { describe, expect, test } from 'bun:test';
import State from '../src/utils/state';
import type { ServerWebSocket } from '../src/ws';

function createMockWs(userId: number): any {
    const sent: string[] = [];
    return {
        data: { userId, id: String(userId), created_at: Date.now() },
        send: (msg: string) => { sent.push(msg); },
        sent,
    };
}

function createMockLogger(): any {
    return { error: () => {}, debug: () => {}, child: () => createMockLogger() };
}

function createMockSQL() {
    const fn: any = () => Promise.resolve([]);
    fn.close = () => {};
    return fn;
}

function createState() {
    return new State(createMockSQL(), createMockLogger());
}

const sampleMsg = { op: 0, d: { hello: 'world' } } as any;

describe('State', () => {
    test('addSocket registers socket and maps to user', () => {
        const state = createState();
        const ws = createMockWs(1);

        state.addSocket(ws);

        expect(state.sockets.has(ws)).toBe(true);
        expect(state.sockets.size).toBe(1);
    });

    test('removeSocket removes socket and cleans up empty user set', () => {
        const state = createState();
        const ws = createMockWs(1);

        state.addSocket(ws);
        state.removeSocket(ws);

        expect(state.sockets.has(ws)).toBe(false);
        expect(state.sockets.size).toBe(0);
    });

    test('multiple sockets for same user are tracked', () => {
        const state = createState();
        const ws1 = createMockWs(1);
        const ws2 = createMockWs(1);

        state.addSocket(ws1);
        state.addSocket(ws2);

        expect(state.sockets.size).toBe(2);

        // Both should receive a targeted message
        state.sendToUser(1, sampleMsg);
        expect(ws1.sent.length).toBe(1);
        expect(ws2.sent.length).toBe(1);
    });

    test('broadcast sends to all connected sockets', () => {
        const state = createState();
        const ws1 = createMockWs(1);
        const ws2 = createMockWs(2);
        const ws3 = createMockWs(3);

        state.addSocket(ws1);
        state.addSocket(ws2);
        state.addSocket(ws3);

        state.broadcast(sampleMsg);

        const raw = JSON.stringify(sampleMsg);
        expect(ws1.sent).toEqual([raw]);
        expect(ws2.sent).toEqual([raw]);
        expect(ws3.sent).toEqual([raw]);
    });

    test('sendToUser sends only to target user sockets', () => {
        const state = createState();
        const ws1 = createMockWs(1);
        const ws2 = createMockWs(2);

        state.addSocket(ws1);
        state.addSocket(ws2);

        state.sendToUser(1, sampleMsg);

        expect(ws1.sent.length).toBe(1);
        expect(ws2.sent.length).toBe(0);
    });

    test('sendToUsers deduplicates across multiple user ids with same socket', () => {
        const state = createState();
        const ws = createMockWs(1);

        state.addSocket(ws);

        // Pass the same userId twice — the socket should only receive one message
        state.sendToUsers([1, 1], sampleMsg);

        expect(ws.sent.length).toBe(1);
    });

    test('sendToLab sends only to sockets in that lab', () => {
        const state = createState();
        const ws1 = createMockWs(1);
        const ws2 = createMockWs(2);

        state.addSocket(ws1);
        state.addSocket(ws2);
        state.addSocketToLab(ws1, 10);

        state.sendToLab(10, sampleMsg);

        expect(ws1.sent.length).toBe(1);
        expect(ws2.sent.length).toBe(0);
    });

    test('sendToLab does nothing for unknown lab', () => {
        const state = createState();
        const ws = createMockWs(1);
        state.addSocket(ws);

        state.sendToLab(999, sampleMsg);

        expect(ws.sent.length).toBe(0);
    });

    test('addSocketToLab / removeSocketFromLab work correctly', () => {
        const state = createState();
        const ws = createMockWs(1);

        state.addSocket(ws);
        state.addSocketToLab(ws, 10);

        state.sendToLab(10, sampleMsg);
        expect(ws.sent.length).toBe(1);

        state.removeSocketFromLab(ws, 10);

        state.sendToLab(10, sampleMsg);
        // Still 1 — no new message after removal
        expect(ws.sent.length).toBe(1);
    });

    test('removeSocketFromLab is a no-op for unknown lab', () => {
        const state = createState();
        const ws = createMockWs(1);
        state.addSocket(ws);

        // Should not throw
        state.removeSocketFromLab(ws, 999);
    });

    test('addUserToLab adds all user sockets to lab', () => {
        const state = createState();
        const ws1 = createMockWs(1);
        const ws2 = createMockWs(1);

        state.addSocket(ws1);
        state.addSocket(ws2);

        state.addUserToLab(1, 10);

        state.sendToLab(10, sampleMsg);
        expect(ws1.sent.length).toBe(1);
        expect(ws2.sent.length).toBe(1);
    });

    test('addUserToLab is a no-op for unknown user', () => {
        const state = createState();

        // Should not throw
        state.addUserToLab(999, 10);
    });

    test('removeUserFromLab removes all user sockets from lab', () => {
        const state = createState();
        const ws1 = createMockWs(1);
        const ws2 = createMockWs(1);

        state.addSocket(ws1);
        state.addSocket(ws2);
        state.addUserToLab(1, 10);

        state.removeUserFromLab(1, 10);

        state.sendToLab(10, sampleMsg);
        expect(ws1.sent.length).toBe(0);
        expect(ws2.sent.length).toBe(0);
    });

    test('removeUserFromLab is a no-op for unknown user', () => {
        const state = createState();

        // Should not throw
        state.removeUserFromLab(999, 10);
    });

    test('removeSocket also cleans up socketsByLab entries', () => {
        const state = createState();
        const ws = createMockWs(1);

        state.addSocket(ws);
        state.addSocketToLab(ws, 10);
        state.addSocketToLab(ws, 20);

        state.removeSocket(ws);

        // After removing the socket, lab-scoped sends should not reach it
        state.sendToLab(10, sampleMsg);
        state.sendToLab(20, sampleMsg);
        expect(ws.sent.length).toBe(0);
    });

    test('error in ws.send does not crash broadcast', () => {
        const state = createState();
        const badWs: any = {
            data: { userId: 1, id: '1', created_at: Date.now() },
            send: () => { throw new Error('connection closed'); },
        };
        const goodWs = createMockWs(2);

        state.addSocket(badWs);
        state.addSocket(goodWs);

        // Should not throw despite badWs erroring
        state.broadcast(sampleMsg);

        expect(goodWs.sent.length).toBe(1);
    });

    test('error in ws.send does not crash sendToLab', () => {
        const state = createState();
        const badWs: any = {
            data: { userId: 1, id: '1', created_at: Date.now() },
            send: () => { throw new Error('connection closed'); },
        };
        const goodWs = createMockWs(2);

        state.addSocket(badWs);
        state.addSocket(goodWs);
        state.addSocketToLab(badWs, 10);
        state.addSocketToLab(goodWs, 10);

        state.sendToLab(10, sampleMsg);

        expect(goodWs.sent.length).toBe(1);
    });

    test('error in ws.send does not crash sendToUsers', () => {
        const state = createState();
        const badWs: any = {
            data: { userId: 1, id: '1', created_at: Date.now() },
            send: () => { throw new Error('connection closed'); },
        };
        const goodWs = createMockWs(2);

        state.addSocket(badWs);
        state.addSocket(goodWs);

        state.sendToUsers([1, 2], sampleMsg);

        expect(goodWs.sent.length).toBe(1);
    });

    test('removing one socket for a user preserves the other', () => {
        const state = createState();
        const ws1 = createMockWs(1);
        const ws2 = createMockWs(1);

        state.addSocket(ws1);
        state.addSocket(ws2);

        state.removeSocket(ws1);

        state.sendToUser(1, sampleMsg);
        expect(ws1.sent.length).toBe(0);
        expect(ws2.sent.length).toBe(1);
    });
});
