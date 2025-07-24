// Shared interfaces for print request and tag operations

export interface RequestCreatePayload {
  labId: number
  file: string
  metadata: any
  description?: string
}

export interface RequestListPayload {
  labId: number
}

export interface TagCreatePayload {
  labId: number
  name: string
  isDefault?: boolean
}

export interface TagSetDefaultPayload {
  tagId: number
  isDefault: boolean
}

export interface RequestAssignTagPayload {
  requestId: number
  tagId: number
  assign: boolean
}

export interface RequestStateUpdatePayload {
  isClosed: boolean
}
