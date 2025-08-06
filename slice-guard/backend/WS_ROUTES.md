# WebSocket Events

All websocket messages are JSON objects with the structure `{ op: number, d: any }`.
Clients connect using `ws://<host>/ws?key=<API_KEY>`. Upon a successful handshake
the server emits a `HELLO` event. Subsequent events notify clients about changes
in real time.

## Event List

| Op Code | Name             | Direction | Payload Description |
|--------:|------------------|-----------|---------------------|
| 0       | `ERROR`          | Server → Client | `{ code: string, message: number }` |
| 1       | `HELLO`          | Server → Client | `{ labs }` complete lab state including roles, members, tags, requests, invites and your permissions |
| 2       | `REQUEST_CREATED`| Server → Client | `{ request, user, tags }` broadcast when a print request is created |
| 3       | `REQUEST_UPDATED`| Server → Client | `{ request, user, tags }` broadcast when a print request is updated |
| 4       | `REQUEST_DELETED`| Server → Client | `{ labId, requestId }` broadcast when a print request is removed |
| 5       | `TAG_CREATED`    | Server → Client | `{ tag }` broadcast when a new tag is created |
| 6       | `TAG_UPDATED`    | Server → Client | `{ tag }` broadcast when a tag changes |
| 7       | `TAG_DELETED`    | Server → Client | `{ labId, tagId }` broadcast when a tag is deleted |
| 8       | `MEMBER_JOINED`  | Server → Client | `{ labId, member, user }` broadcast when a member joins |
| 9       | `MEMBER_LEFT`    | Server → Client | `{ labId, userId }` broadcast when a member leaves |
| 10      | `INVITE_CREATED` | Server → Client | `{ invite }` broadcast when an invite is created |
| 11      | `INVITE_UPDATED` | Server → Client | `{ invite }` broadcast when an invite is updated or used |
| 12      | `INVITE_DELETED` | Server → Client | `{ labId, inviteId }` broadcast when an invite is deleted |
| 13      | `USER_UPDATED`   | Server → Client | `{ user }` broadcast when a user updates their profile |
| 14      | `ROLE_CREATED`   | Server → Client | `{ role }` broadcast when a role is created |
| 15      | `ROLE_UPDATED`   | Server → Client | `{ role }` broadcast when a role is updated |
| 16      | `ROLE_DELETED`   | Server → Client | `{ labId, roleId }` broadcast when a role is deleted |
| 17      | `LAB_CREATED`    | Server → Client | `{ lab }` full lab state when a lab is created |
| 18      | `LAB_UPDATED`    | Server → Client | `{ lab }` broadcast when lab details change |
| 19      | `LAB_DELETED`    | Server → Client | `{ labId }` broadcast when a lab is deleted |

Payload interfaces are defined in `slice-guard/shared/payloads/ws.ts` and reused
by both the frontend and backend.
