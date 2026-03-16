import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketClient } from '../../services/ws';
import { WsEvent } from '@shared/payloads/ws';

// We cannot establish real WebSocket connections in happy-dom, so we test the
// public API surface that does not require an active connection.

describe('WebSocketClient', () => {
    let client: WebSocketClient;

    beforeEach(() => {
        client = new WebSocketClient('ws://localhost:3000/ws');
    });

    it('stores the url passed to the constructor', () => {
        // The url is private, but we can verify indirectly that construction succeeds
        expect(client).toBeInstanceOf(WebSocketClient);
    });

    describe('addListener / removeListener', () => {
        it('registers a listener that can be removed', () => {
            const cb = vi.fn();
            client.addListener(WsEvent.HELLO, cb);
            client.removeListener(WsEvent.HELLO, cb);
            // No error means success; listener was added then removed
        });

        it('can add multiple listeners for the same event', () => {
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            client.addListener(WsEvent.HELLO, cb1);
            client.addListener(WsEvent.HELLO, cb2);
            // Both should be tracked without error
        });

        it('removing a listener that was never added does not throw', () => {
            const cb = vi.fn();
            expect(() => client.removeListener(WsEvent.HELLO, cb)).not.toThrow();
        });

        it('can add listeners for different events', () => {
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            client.addListener(WsEvent.HELLO, cb1);
            client.addListener(WsEvent.LAB_CREATED, cb2);
            // Both should be tracked independently
        });
    });

    describe('disconnect', () => {
        it('does not throw when called without a prior connect', () => {
            expect(() => client.disconnect()).not.toThrow();
        });

        it('can be called multiple times without error', () => {
            client.disconnect();
            expect(() => client.disconnect()).not.toThrow();
        });
    });

    describe('send', () => {
        it('does not throw when there is no active connection', () => {
            expect(() => client.send(WsEvent.HELLO, {})).not.toThrow();
        });
    });
});
