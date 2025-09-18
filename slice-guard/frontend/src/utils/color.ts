/**
 * Color conversion utilities for the frontend.
 *
 * All colors are represented as lower-case hex strings of the form `#rrggbb`
 * unless noted otherwise.
 */

/** RGB color components in the 0-255 range. */
export interface Rgb {
    r: number;
    g: number;
    b: number;
}

/** HSV color components. `h` in degrees [0,360), `s` and `v` in [0,100]. */
export interface Hsv {
    h: number;
    s: number;
    v: number;
}

/** HSL color components. `h` in degrees [0,360), `s` and `l` in [0,100]. */
export interface Hsl {
    h: number;
    s: number;
    l: number;
}

/** Clamp a number between `min` and `max`. */
export function clamp(n: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, n));
}

/**
 * Normalize a hex string.
 *
 * Supports shorthand `#rgb` form and ensures the result is a 6-digit
 * lower-case string starting with `#`. Returns `#000000` for invalid input.
 */
export function normalizeHex(v: string | null | undefined): string {
    if (!v) {
        return '#000000';
    }
    if (!v.startsWith('#')) {
        return v.toLowerCase();
    }
    return v.length === 4
        ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase()
        : v.slice(0, 7).toLowerCase();
}

/** Convert a hex string to RGB components. */
export function hexToRgb(hex: string): Rgb {
    const v = normalizeHex(hex);
    const num = parseInt(v.slice(1, 7), 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/** Convert RGB components to a hex string. */
export function rgbToHex(r: number, g: number, b: number): string {
    return (
        '#' +
        [r, g, b]
            .map((x) => clamp(x / 255, 0, 1) * 255)
            .map((x) => Math.round(x).toString(16).padStart(2, '0'))
            .join('')
    ).toLowerCase();
}

/** Convert RGB components (0-255) to HSV. */
export function rgbToHsv(r: number, g: number, b: number): Hsv {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h: h * 360, s: s * 100, v: v * 100 };
}

/** Convert HSV components to RGB. */
export function hsvToRgb(h: number, s: number, v: number): Rgb {
    h = ((h % 360) + 360) % 360;
    s = clamp(s / 100);
    v = clamp(v / 100);
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));
    let r = 0,
        g = 0,
        b = 0;
    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/** Convert RGB components (0-255) to HSL. */
export function rgbToHsl(r: number, g: number, b: number): Hsl {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) {
        return { h: 0, s: 0, l: l * 100 };
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    switch (max) {
        case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
        case g:
            h = (b - r) / d + 2;
            break;
        default:
            h = (r - g) / d + 4;
            break;
    }
    h /= 6;
    return { h: h * 360, s: s * 100, l: l * 100 };
}

/** Convert HSL components to RGB. */
export function hslToRgb(h: number, s: number, l: number): Rgb {
    h = ((h % 360) + 360) % 360;
    s = clamp(s / 100);
    l = clamp(l / 100);

    if (s === 0) {
        const v = Math.round(l * 255);
        return { r: v, g: v, b: v };
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hk = h / 360;
    const channel = (t: number) => {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    };
    const r = channel(hk + 1 / 3);
    const g = channel(hk);
    const b = channel(hk - 1 / 3);
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
