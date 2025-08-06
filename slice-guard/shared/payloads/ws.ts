// Message types used over the WebSocket connection

import type { ErrorCode } from '../ws/errors'
import type { PrintRequest, RequestTag } from '../db/request'
import type { User } from '../db/user'
import type { Lab, LabRole, LabMember } from '../db/lab'

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
  /** Emitted when an existing print request is updated. */
  REQUEST_UPDATED = 3,
  /** Emitted when a print request is deleted. */
  REQUEST_DELETED = 4,
  /** Emitted when a tag is created. */
  TAG_CREATED = 5,
  /** Emitted when a tag is updated. */
  TAG_UPDATED = 6,
  /** Emitted when a tag is deleted. */
  TAG_DELETED = 7,
  /** Emitted when a member joins a lab. */
  MEMBER_JOINED = 8,
  /** Emitted when a member leaves a lab. */
  MEMBER_LEFT = 9,
}

export type WsEventType = keyof typeof WsEvent
export type WsEventValue = typeof WsEvent[WsEventType]

export interface PrintRequestEvent {
  request: PrintRequest
  user: User | null
  tags: RequestTag[]
}

export interface RequestDeletedEvent {
  labId: number
  requestId: number
}

export interface TagEvent {
  tag: RequestTag
}

export interface TagDeletedEvent {
  labId: number
  tagId: number
}

export interface MemberEvent {
  labId: number
  member: LabMember
  user: User | null
}

export interface MemberLeftEvent {
  labId: number
  userId: number
}

export interface LabState {
  lab: Lab
  roles: LabRole[]
  members: MemberEvent[]
  tags: RequestTag[]
  requests: PrintRequestEvent[]
}

export interface ErrorPayload {
  code: ErrorCode
  message: number
}

export type WsPayloads = {
  [WsEvent.HELLO]: { op: WsEvent.HELLO; d: { labs: LabState[] } }
  [WsEvent.REQUEST_CREATED]: { op: WsEvent.REQUEST_CREATED; d: PrintRequestEvent }
  [WsEvent.REQUEST_UPDATED]: { op: WsEvent.REQUEST_UPDATED; d: PrintRequestEvent }
  [WsEvent.REQUEST_DELETED]: { op: WsEvent.REQUEST_DELETED; d: RequestDeletedEvent }
  [WsEvent.TAG_CREATED]: { op: WsEvent.TAG_CREATED; d: TagEvent }
  [WsEvent.TAG_UPDATED]: { op: WsEvent.TAG_UPDATED; d: TagEvent }
  [WsEvent.TAG_DELETED]: { op: WsEvent.TAG_DELETED; d: TagDeletedEvent }
  [WsEvent.MEMBER_JOINED]: { op: WsEvent.MEMBER_JOINED; d: MemberEvent }
  [WsEvent.MEMBER_LEFT]: { op: WsEvent.MEMBER_LEFT; d: MemberLeftEvent }
  [WsEvent.ERROR]: { op: WsEvent.ERROR; d: ErrorPayload }
}

export type WsPayload<T extends WsEventValue> = WsPayloads[T]
export type WsPayloadMap = WsPayloads
export type WsPayloadUnion = WsPayloadMap[WsEventValue]
