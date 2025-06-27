// Message types used over the WebSocket connection

export enum WsEvent {
  ERROR = 0,
}

export type WsEventType = keyof typeof WsEvent
export type WsEventValue = typeof WsEvent[WsEventType]

export interface WsPayload<T extends WsEventValue> {
  op: T
  d: any
}

export type WsPayloads = { [K in WsEventValue]: WsPayload<K> }
export type WsPayloadMap = { [K in WsEventValue]: WsPayloads[K] }
export type WsPayloadUnion = WsPayloadMap[WsEventValue]
