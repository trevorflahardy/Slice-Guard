import { expect, test } from 'bun:test';
import { generateRefreshToken } from '../src/utils/refresh';

// Basic sanity checks for refresh token generation

test('generateRefreshToken returns a string token', () => {
    const token = generateRefreshToken('1');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
});
