/**
 * @fileoverview Refresh token utility functions for signing and verifying tokens.
 */

/**
 * Generate a refresh token for a given user using their ID. Token
 * is generated from the current time, ensuring that it is unique.
 *
 * @param userId The user ID to generate the refresh token for.
 * @returns A unique refresh token string.
 */
export function generateRefreshToken(userId: string): string {
    const now = Math.floor(Date.now() / 1000);

    return Bun.hash(`${userId}${now}$`).toString();
}