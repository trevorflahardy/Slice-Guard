export interface InviteCreatePayload {
  maxUses?: number | null;
  /** expiration in seconds from now */
  expiresIn?: number | null;
}

export interface InviteUpdatePayload {
  maxUses?: number | null;
  /** ISO timestamp */
  expiresAt?: string | null;
}
