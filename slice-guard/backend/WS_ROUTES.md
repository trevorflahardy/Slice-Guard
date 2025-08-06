# WebSocket Events

All websocket messages are JSON objects with the structure `{ op: number, d: any }`.
Clients connect using `ws://<host>/ws?key=<API_KEY>`. Upon a successful handshake
the server emits a `HELLO` event. Subsequent events notify clients about changes
in real time.

## Event List

| Op Code | Name             | Direction | Payload Description |
|--------:|------------------|-----------|---------------------|
| 0       | `ERROR`          | Server → Client | `{ code: string, message: number }` |
| 1       | `HELLO`          | Server → Client | `{}` sent after a successful connection |
| 2       | `REQUEST_CREATED`| Server → Client | `{ request, user, tags }` – broadcast when a print request is created |

Payload interfaces are defined in `slice-guard/shared/payloads/ws.ts` and reused
by both the frontend and backend.
