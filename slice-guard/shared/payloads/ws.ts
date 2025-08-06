// Message types used over the WebSocket connection

import type { ErrorCode } from '../ws/errors'
import type { PrintRequest, RequestTag } from '../db/request'
import type { User } from '../db/user'

/**
 * All websocket opcodes supported by the application.
 */
export enum WsEvent {
  /** Generic error event. */
  ERROR = 0,
  /** Sent by the server immediately after a successful connection. */
  HELLO = 1,
  /** Emitted when a new print request is created. */
  REQUEST_CREATED = 2,
}

export type WsEventType = keyof typeof WsEvent
export type WsEventValue = typeof WsEvent[WsEventType]

export interface PrintRequestEvent {
  request: PrintRequest
  user: User | null
  tags: RequestTag[]
}

export interface ErrorPayload {
  code: ErrorCode
  message: number
}

export type WsPayloads = {
  [WsEvent.HELLO]: { op: WsEvent.HELLO; d: Record<string, never> }
  [WsEvent.REQUEST_CREATED]: { op: WsEvent.REQUEST_CREATED; d: PrintRequestEvent }
  [WsEvent.ERROR]: { op: WsEvent.ERROR; d: ErrorPayload }
}

export type WsPayload<T extends WsEventValue> = WsPayloads[T]
export type WsPayloadMap = WsPayloads
export type WsPayloadUnion = WsPayloadMap[WsEventValue]
