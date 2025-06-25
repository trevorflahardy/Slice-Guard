# WebSocket Routes

This document lists all websocket opcodes exposed by the backend along with a short description of the request payload and the response returned. Every message is a JSON object with the structure `{ op: number, d: any }`.

| OpCode | Direction | Payload (`d`) | Description |
| ------ | --------- | ------------- | ----------- |
| `AUTH_LOGIN` | client -> server | `{ email, password }` | Log in a user. Returns `AUTH_SUCCESS` or `AUTH_FAILURE`. |
| `AUTH_REGISTER` | client -> server | `{ email, password, name }` | Register a new user. Returns `AUTH_SUCCESS` or `AUTH_FAILURE`. |
| `AUTH_REFRESH` | client -> server | `{ refreshToken }` | Refresh an access token. Returns `AUTH_REFRESH_SUCCESS` or `AUTH_FAILURE`. |
| `AUTH_LOGOUT` | client -> server | `{ refreshToken }` | Invalidate a refresh token. |
| `REQUEST_CREATE` | client -> server | `{ labId, file, metadata, description?, token }` | Upload a print request. Returns created request. |
| `REQUEST_LIST` | client -> server | `{ labId, token }` | List user requests for a lab. |
| `TAG_CREATE` | client -> server | `{ labId, name, isDefault?, token }` | Create a new request tag. |
| `TAG_SET_DEFAULT` | client -> server | `{ tagId, isDefault, token }` | Toggle default status on a tag. |
| `REQUEST_ASSIGN_TAG` | client -> server | `{ requestId, tagId, assign, token }` | Assign or remove a tag from a request. |
| `LAB_CREATE` | client -> server | `{ name, description?, imageUrl?, token }` | Create a new lab owned by the user. |
| `LAB_UPDATE` | client -> server | `{ labId, name, description?, imageUrl?, token }` | Update a lab's fields. Requires `EDIT_LAB` permission. |
| `LAB_DELETE` | client -> server | `{ labId, token }` | Delete a lab. Requires `DELETE_LAB` permission. |
| `ROLE_CREATE` | client -> server | `{ labId, name, permissions, token }` | Create a role in a lab. Requires `MANAGE_ROLES`. |
| `MEMBER_ADD` | client -> server | `{ labId, userId, roleId, token }` | Add a member to a lab. Requires `MANAGE_ROLES`. |
| `MEMBER_REMOVE` | client -> server | `{ labId, userId, token }` | Remove a user from a lab. Requires `REMOVE_USER`. |

Responses use the same opcode as the request unless otherwise noted. Errors are reported with opcode `ERROR` and follow `{ code, message }`.
