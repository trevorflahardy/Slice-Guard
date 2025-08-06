# WebSocket Events

All websocket messages are JSON objects with the structure `{ op: number, d: any }`.
Clients connect using `ws://<host>/ws?key=<API_KEY>`. Upon a successful handshake
the server emits a `HELLO` event. Subsequent events notify clients about changes
in real time.

## Event List

| Op Code | Name             | Direction | Payload Description |
|--------:|------------------|-----------|---------------------|
| 0       | `ERROR`          | Server → Client | `{ code: string, message: number }` |
| 1       | `HELLO`          | Server → Client | `{ labs }` complete lab state on connection |
| 2       | `REQUEST_CREATED`| Server → Client | `{ request, user, tags }` broadcast when a print request is created |
| 3       | `REQUEST_UPDATED`| Server → Client | `{ request, user, tags }` broadcast when a print request is updated |
| 4       | `REQUEST_DELETED`| Server → Client | `{ labId, requestId }` broadcast when a print request is removed |
| 5       | `TAG_CREATED`    | Server → Client | `{ tag }` broadcast when a new tag is created |
| 6       | `TAG_UPDATED`    | Server → Client | `{ tag }` broadcast when a tag changes |
| 7       | `TAG_DELETED`    | Server → Client | `{ labId, tagId }` broadcast when a tag is deleted |
| 8       | `MEMBER_JOINED`  | Server → Client | `{ labId, member, user }` broadcast when a member joins |
| 9       | `MEMBER_LEFT`    | Server → Client | `{ labId, userId }` broadcast when a member leaves |

Payload interfaces are defined in `slice-guard/shared/payloads/ws.ts` and reused
by both the frontend and backend.
