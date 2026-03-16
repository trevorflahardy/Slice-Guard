/**
 * Vitest setup file.
 *
 * @vue/devtools-kit calls localStorage.getItem during module initialisation.
 * happy-dom exposes localStorage on the global object but the devtools-kit
 * reference can resolve before the environment fully wires it up.  This shim
 * ensures a working Storage implementation is always available.
 */

if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
    const store = new Map<string, string>();
    globalThis.localStorage = {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); },
        get length() { return store.size; },
        key: (index: number) => [...store.keys()][index] ?? null,
    } as Storage;
}
