/**
 * @fileoverview Helpers for hashing passwords.
 */

import { type StringOrBuffer } from 'bun';

/**
 * Hashes a password using Bun's argon2 implementation. This will
 * use the default settings for argon2, which is a good balance
 * between security and performance. Automatically salts the password
 * using a random salt.
 *
 * @param pw The password to hash
 * @returns  The hashed password
 */
export const hashPassword = async (pw: StringOrBuffer): Promise<string> => {
    return await Bun.password.hash(pw, 'argon2id');
};

/**
 * Verifies a password against a hash using Bun's argon2 implementation.
 *
 * @param pw The password to verify
 * @param hash The hash to verify against
 * @throws If the hash is invalid, the algorithm does not match the hash, or the hash is invalid.
 * @returns True if the password matches the hash, False otherwise.
 */
export const verifyPassword = async (
    pw: StringOrBuffer,
    hash: StringOrBuffer,
): Promise<boolean> => {
    return await Bun.password.verify(pw, hash, 'argon2id');
};
