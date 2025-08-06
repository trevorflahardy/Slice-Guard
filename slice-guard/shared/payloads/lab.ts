// Shared interfaces for lab management payloads

export interface LabCreatePayload {
  name: string
  description?: string | null
  iconUrl?: string | null
}

export interface LabUpdatePayload {
  labId: number
  name: string
  description?: string | null
  iconUrl?: string | null
}

export interface LabDeletePayload {
  labId: number
}

export interface RoleCreatePayload {
  labId: number
  name: string
  permissions: number
}

export interface MemberAddPayload {
  labId: number
  userId: number
  roleId: number | null
}

export interface MemberRemovePayload {
  labId: number
  userId: number
}
