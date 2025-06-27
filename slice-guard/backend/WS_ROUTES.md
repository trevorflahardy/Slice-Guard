# WebSocket Routes

This document lists all websocket opcodes exposed by the backend along with a short description of the request payload and the response returned. Every message is a JSON object with the structure `{ op: number, d: any }`.

All request management has moved to REST alongside authentication and lab routes. No opcodes are currently handled over the socket.

Responses use the same opcode as the request unless otherwise noted. Errors are reported with opcode `ERROR` and follow `{ code, message }`.
