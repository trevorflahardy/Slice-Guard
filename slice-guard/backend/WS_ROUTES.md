# WebSocket Routes

This document lists all websocket opcodes exposed by the backend along with a short description of the request payload and the response returned. Every message is a JSON object with the structure `{ op: number, d: any }`.

| OpCode | Direction | Payload (`d`) | Description |
| ------ | --------- | ------------- | ----------- |
| `REQUEST_CREATE` | client -> server | `{ labId, file, metadata, description?, token }` | Upload a print request. Returns created request. |
| `REQUEST_LIST` | client -> server | `{ labId, token }` | List user requests for a lab. |
| `TAG_CREATE` | client -> server | `{ labId, name, isDefault?, token }` | Create a new request tag. |
| `TAG_SET_DEFAULT` | client -> server | `{ tagId, isDefault, token }` | Toggle default status on a tag. |
| `REQUEST_ASSIGN_TAG` | client -> server | `{ requestId, tagId, assign, token }` | Assign or remove a tag from a request. |

Authentication and lab management are now handled by REST endpoints instead of WebSocket messages.

Responses use the same opcode as the request unless otherwise noted. Errors are reported with opcode `ERROR` and follow `{ code, message }`.
