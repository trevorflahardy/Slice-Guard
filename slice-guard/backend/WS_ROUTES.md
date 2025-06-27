# WebSocket Routes

This document lists websocket events exposed by the backend. Every message is a JSON object with the structure `{ op: number, d: any }`.

All request management has moved to REST alongside authentication and lab routes. No events are currently handled over the socket. Payload interfaces reside in `slice-guard/shared/payloads` and are shared with the REST API.

Responses use the same event code as the request unless otherwise noted. Errors use the `ERROR` event and follow `{ code, message }`.
