/**
 * Helpers for hashing passwords.
 */

export const hashPassword = async (pw: string): Promise<string> => {
    // Pre-salted and hashed using Bun's argon2 default
    // implementation - no need to change this, really.
    return await Bun.password.hash(pw)
}

export const verifyPassword = async (pw: string, hash: string): Promise<boolean> => {
    // Pre-salted and hashed using Bun's argon2 default
    // implementation - no need to change this, really.
    return await Bun.password.verify(pw, hash)
}