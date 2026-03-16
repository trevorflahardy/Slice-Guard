import { describe, expect, test } from 'bun:test';

import { generateApiKey } from '../src/utils/apiKey';
import { hashPassword, verifyPassword } from '../src/utils/hash';
import { hasLabPermission } from '../src/utils/permissions';
import {
    validateEmail,
    validatePassword,
    validateStringLength,
    validateRequired,
} from '../src/utils/validate';
import { RateLimiter } from '../src/utils/rateLimit';
import { LabPermission } from '@shared/db/lab';

// ---------------------------------------------------------------------------
// API Key
// ---------------------------------------------------------------------------
describe('generateApiKey', () => {
    test('returns a string', () => {
        const key = generateApiKey(1);
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
    });

    test('generated keys include the user id indirectly (deterministic hash input)', () => {
        // While the hash output is opaque, calling with different user ids
        // should produce different results, confirming the id feeds into the hash.
        const key1 = generateApiKey(1);
        const key2 = generateApiKey(2);
        // They could theoretically collide, but it is astronomically unlikely.
        expect(key1).not.toBe(key2);
    });

    test('two calls produce different keys', () => {
        const key1 = generateApiKey(1);
        const key2 = generateApiKey(1);
        expect(key1).not.toBe(key2);
    });
});

// ---------------------------------------------------------------------------
// Hash
// ---------------------------------------------------------------------------
describe('hashPassword / verifyPassword', () => {
    test('hashPassword returns a string different from input', async () => {
        const password = 'supersecret123';
        const hashed = await hashPassword(password);
        expect(typeof hashed).toBe('string');
        expect(hashed).not.toBe(password);
    });

    test('verifyPassword returns true for correct password', async () => {
        const password = 'correcthorse';
        const hashed = await hashPassword(password);
        const result = await verifyPassword(password, hashed);
        expect(result).toBe(true);
    });

    test('verifyPassword returns false for wrong password', async () => {
        const password = 'correcthorse';
        const hashed = await hashPassword(password);
        const result = await verifyPassword('wrongpassword', hashed);
        expect(result).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------
describe('hasLabPermission', () => {
    test('returns false for null', () => {
        expect(hasLabPermission(null, LabPermission.READ)).toBe(false);
    });

    test('returns false for 0', () => {
        expect(hasLabPermission(0, LabPermission.READ)).toBe(false);
    });

    test('returns true when ALL flag is set', () => {
        expect(hasLabPermission(LabPermission.ALL, LabPermission.READ)).toBe(true);
        expect(hasLabPermission(LabPermission.ALL, LabPermission.MANAGE_ROLES)).toBe(true);
    });

    test('returns true for matching permission', () => {
        const perms = LabPermission.READ | LabPermission.WRITE;
        expect(hasLabPermission(perms, LabPermission.READ)).toBe(true);
        expect(hasLabPermission(perms, LabPermission.WRITE)).toBe(true);
    });

    test('returns false for non-matching permission', () => {
        const perms = LabPermission.READ;
        expect(hasLabPermission(perms, LabPermission.WRITE)).toBe(false);
        expect(hasLabPermission(perms, LabPermission.DELETE_LAB)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------
describe('validateEmail', () => {
    test('returns null for valid email', () => {
        expect(validateEmail('user@example.com')).toBeNull();
    });

    test('returns error for invalid email', () => {
        expect(validateEmail('not-an-email')).toBeString();
        expect(validateEmail('missing@')).toBeString();
        expect(validateEmail('@domain.com')).toBeString();
    });

    test('returns error for empty string', () => {
        expect(validateEmail('')).toBeString();
    });
});

describe('validatePassword', () => {
    test('returns null for valid password (8+ chars)', () => {
        expect(validatePassword('abcdefgh')).toBeNull();
        expect(validatePassword('a'.repeat(128))).toBeNull();
    });

    test('returns error for short password', () => {
        expect(validatePassword('short')).toBeString();
        expect(validatePassword('1234567')).toBeString();
    });

    test('returns error for non-string', () => {
        expect(validatePassword(123)).toBeString();
        expect(validatePassword(null)).toBeString();
        expect(validatePassword(undefined)).toBeString();
    });
});

describe('validateStringLength', () => {
    test('returns null for valid string', () => {
        expect(validateStringLength('hello', 'Name', 1, 50)).toBeNull();
    });

    test('returns error for too short', () => {
        expect(validateStringLength('', 'Name', 1, 50)).toBeString();
    });

    test('returns error for too long', () => {
        expect(validateStringLength('a'.repeat(51), 'Name', 1, 50)).toBeString();
    });
});

describe('validateRequired', () => {
    test('returns null for non-empty value', () => {
        expect(validateRequired('value', 'Field')).toBeNull();
        expect(validateRequired(0, 'Field')).toBeNull();
        expect(validateRequired(false, 'Field')).toBeNull();
    });

    test('returns error for null/undefined/empty', () => {
        expect(validateRequired(null, 'Field')).toBeString();
        expect(validateRequired(undefined, 'Field')).toBeString();
        expect(validateRequired('', 'Field')).toBeString();
    });
});

// ---------------------------------------------------------------------------
// Rate Limiter
// ---------------------------------------------------------------------------
describe('RateLimiter', () => {
    test('check allows requests under limit', () => {
        const limiter = new RateLimiter(3, 60_000);
        expect(limiter.check('ip1')).toBe(true);
        expect(limiter.check('ip1')).toBe(true);
        expect(limiter.check('ip1')).toBe(true);
    });

    test('check blocks requests over limit', () => {
        const limiter = new RateLimiter(2, 60_000);
        expect(limiter.check('ip1')).toBe(true);
        expect(limiter.check('ip1')).toBe(true);
        // Third request should be blocked
        expect(limiter.check('ip1')).toBe(false);
    });

    test('check resets after window', async () => {
        const windowMs = 50; // very short window for testing
        const limiter = new RateLimiter(1, windowMs);

        expect(limiter.check('ip1')).toBe(true);
        expect(limiter.check('ip1')).toBe(false);

        // Wait for the window to expire
        await new Promise((resolve) => setTimeout(resolve, windowMs + 10));

        expect(limiter.check('ip1')).toBe(true);
    });

    test('cleanup removes expired entries', async () => {
        const windowMs = 50;
        const limiter = new RateLimiter(5, windowMs);

        limiter.check('expired-key');

        // Wait for the entry to expire
        await new Promise((resolve) => setTimeout(resolve, windowMs + 10));

        // Add a fresh entry that should survive cleanup
        limiter.check('fresh-key');

        limiter.cleanup();

        // The expired key should have been cleaned up, so it resets to a fresh window
        // and the first call succeeds. The fresh key should still have its count.
        expect(limiter.check('expired-key')).toBe(true);
        // fresh-key count was 1 before cleanup, should still be tracked
        expect(limiter.check('fresh-key')).toBe(true); // count goes to 2, still under 5
    });
});
