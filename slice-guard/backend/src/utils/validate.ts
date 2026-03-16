/**
 * Input validation utilities for request payloads.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: unknown): string | null {
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
        return 'Invalid email address';
    }
    if (email.length > 254) {
        return 'Email too long';
    }
    return null;
}

export function validatePassword(password: unknown): string | null {
    if (typeof password !== 'string') {
        return 'Password is required';
    }
    if (password.length < 8) {
        return 'Password must be at least 8 characters';
    }
    if (password.length > 128) {
        return 'Password too long';
    }
    return null;
}

export function validateStringLength(
    value: unknown,
    field: string,
    min: number,
    max: number,
): string | null {
    if (typeof value !== 'string') {
        return `${field} is required`;
    }
    const trimmed = value.trim();
    if (trimmed.length < min) {
        return `${field} must be at least ${min} characters`;
    }
    if (trimmed.length > max) {
        return `${field} must be at most ${max} characters`;
    }
    return null;
}

export function validateRequired(value: unknown, field: string): string | null {
    if (value === undefined || value === null || value === '') {
        return `${field} is required`;
    }
    return null;
}
