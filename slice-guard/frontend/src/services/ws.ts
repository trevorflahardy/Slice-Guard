import { WsEvent, type WsPayloadUnion, type WsPayloadMap } from '@shared/payloads/ws';

export type Listener<K extends WsEvent = WsEvent> = (data: WsPayloadMap[K]['d']) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectId: number | null = null;
    private key: string | undefined;
    private retryCount = 0;
    private maxRetries = 10;
    private listeners = new Map<WsEvent, Set<Listener>>();

    constructor(url: string) {
        this.url = url;
    }

    connect(key?: string) {
        if (this.ws) {
            return;
        }
        if (key !== undefined) {
            this.key = key;
        }
        const url = this.key ? `${this.url}?key=${encodeURIComponent(this.key)}` : this.url;
        this.ws = new WebSocket(url);
        this.ws.addEventListener('open', () => {
            this.retryCount = 0;
        });
        this.ws.addEventListener('message', (ev) => {
            try {
                const msg: WsPayloadUnion = JSON.parse(ev.data);
                if (import.meta.env.DEV) {
                    console.debug('[ws] <=', msg);
                }
                this.dispatch(msg);
            } catch {
                console.error('Invalid WS message', ev.data);
            }
        });
        this.ws.addEventListener('close', () => {
            this.ws = null;
            if (this.reconnectId === null && this.retryCount < this.maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
                this.retryCount++;
                this.reconnectId = window.setTimeout(() => {
                    this.reconnectId = null;
                    this.connect();
                }, delay);
            }
        });
    }

    disconnect() {
        if (this.reconnectId !== null) {
            clearTimeout(this.reconnectId);
            this.reconnectId = null;
        }
        this.retryCount = this.maxRetries; // Prevent reconnect
        this.ws?.close();
        this.ws = null;
    }

    send(op: WsEvent, d: unknown) {
        this.ws?.send(JSON.stringify({ op, d }));
    }

    addListener<K extends WsEvent>(op: K, cb: Listener<K>) {
        if (!this.listeners.has(op)) {
            this.listeners.set(op, new Set());
        }
        this.listeners.get(op)!.add(cb as Listener);
    }

    removeListener<K extends WsEvent>(op: K, cb: Listener<K>) {
        this.listeners.get(op)?.delete(cb as Listener);
    }

    private dispatch(msg: WsPayloadUnion) {
        const set = this.listeners.get(msg.op);
        if (import.meta.env.DEV) {
            const count = set ? set.size : 0;
            console.debug('[ws] dispatch', msg.op, `to ${count} listener(s)`);
        }
        if (!set) {
            return;
        }
        for (const cb of Array.from(set) as Listener[]) {
            try {
                cb(msg.d as never);
            } catch (err) {
                console.error(err);
            }
        }
    }
}

const WS_URL =
    (import.meta as unknown as { env: { VITE_WS_URL?: string } }).env.VITE_WS_URL ??
    'ws://localhost:3000/ws';
export const ws = new WebSocketClient(WS_URL);
