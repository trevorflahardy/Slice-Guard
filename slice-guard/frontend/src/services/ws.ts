import { OpCode, type OpCodePayload } from '@shared/ws/opcodes'

export type Listener = (data: any) => void

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectId: number | null = null
  private listeners = new Map<OpCode, Set<Listener>>()

  constructor(url: string) {
    this.url = url
  }

  connect(key?: string) {
    if (this.ws) return
    const url = key ? `${this.url}?key=${encodeURIComponent(key)}` : this.url
    this.ws = new WebSocket(url)
    this.ws.addEventListener('message', (ev) => {
      try {
        const msg: OpCodePayload<OpCode> = JSON.parse(ev.data)
        this.dispatch(msg)
      } catch {
        console.error('Invalid WS message', ev.data)
      }
    })
    this.ws.addEventListener('close', () => {
      this.ws = null
      if (this.reconnectId == null) {
        this.reconnectId = window.setTimeout(() => {
          this.reconnectId = null
          this.connect()
        }, 2000)
      }
    })
  }

  send(op: OpCode, d: any) {
    this.ws?.send(JSON.stringify({ op, d }))
  }

  addListener(op: OpCode, cb: Listener) {
    if (!this.listeners.has(op)) this.listeners.set(op, new Set())
    this.listeners.get(op)!.add(cb)
  }

  removeListener(op: OpCode, cb: Listener) {
    this.listeners.get(op)?.delete(cb)
  }

  private dispatch(msg: OpCodePayload<OpCode>) {
    const set = this.listeners.get(msg.op)
    if (!set) return
    for (const cb of Array.from(set)) {
      try {
        cb(msg.d)
      } catch (err) {
        console.error(err)
      }
    }
  }
}

const WS_URL = (import.meta as any).env.VITE_WS_URL ?? 'ws://localhost:3000/ws'
export const ws = new WebSocketClient(WS_URL)
