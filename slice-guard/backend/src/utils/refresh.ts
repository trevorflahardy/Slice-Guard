/**
 * @fileoverview Refresh token utility functions for signing and verifying tokens.
 */

export function generateRefreshToken(userId: string): string {
    const now = Math.floor(Date.now() / 1000);

    return Bun.hash(`${userId}${now}$`).toString();
}