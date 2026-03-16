import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../store/auth';

describe('auth store', () => {
    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    it('has null user and null apiKey initially', () => {
        const auth = useAuthStore();
        expect(auth.user).toBeNull();
        expect(auth.apiKey).toBeNull();
    });

    it('setSession stores apiKey and user', () => {
        const auth = useAuthStore();
        const user = {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            avatar_url: null,
            created_at: new Date(),
        };

        auth.setSession('my-api-key', user);

        expect(auth.apiKey).toBe('my-api-key');
        expect(auth.user).toEqual(user);
        expect(localStorage.getItem('apiKey')).toBe('my-api-key');
        expect(JSON.parse(localStorage.getItem('user')!)).toEqual(
            JSON.parse(JSON.stringify(user)),
        );
    });

    it('clearSession resets apiKey and user to null', () => {
        const auth = useAuthStore();
        const user = {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            avatar_url: null,
            created_at: new Date(),
        };

        auth.setSession('my-api-key', user);
        auth.clearSession();

        expect(auth.apiKey).toBeNull();
        expect(auth.user).toBeNull();
        expect(localStorage.getItem('apiKey')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    });

    it('restores session from localStorage on store creation', () => {
        const user = {
            id: 5,
            email: 'saved@example.com',
            name: 'Saved',
            avatar_url: null,
            created_at: new Date().toISOString(),
        };
        localStorage.setItem('apiKey', 'restored-key');
        localStorage.setItem('user', JSON.stringify(user));

        // Create a fresh pinia so the store re-reads localStorage
        setActivePinia(createPinia());
        const auth = useAuthStore();

        expect(auth.apiKey).toBe('restored-key');
        expect(auth.user).toEqual(user);
    });
});
