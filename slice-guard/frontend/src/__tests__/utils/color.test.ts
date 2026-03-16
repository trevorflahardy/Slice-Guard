import { describe, it, expect } from 'vitest';
import {
    clamp,
    normalizeHex,
    hexToRgb,
    rgbToHex,
    rgbToHsv,
    hsvToRgb,
    rgbToHsl,
    hslToRgb,
} from '../../utils/color';

describe('clamp', () => {
    it('returns the value when within range', () => {
        expect(clamp(0.5)).toBe(0.5);
    });

    it('clamps to min', () => {
        expect(clamp(-1)).toBe(0);
    });

    it('clamps to max', () => {
        expect(clamp(2)).toBe(1);
    });

    it('respects custom min and max', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });
});

describe('normalizeHex', () => {
    it('returns #000000 for null or undefined', () => {
        expect(normalizeHex(null)).toBe('#000000');
        expect(normalizeHex(undefined)).toBe('#000000');
        expect(normalizeHex('')).toBe('#000000');
    });

    it('expands shorthand #rgb to #rrggbb', () => {
        expect(normalizeHex('#fff')).toBe('#ffffff');
        expect(normalizeHex('#ABC')).toBe('#aabbcc');
    });

    it('lowercases a full hex string', () => {
        expect(normalizeHex('#FF0000')).toBe('#ff0000');
    });

    it('truncates strings longer than 7 characters', () => {
        expect(normalizeHex('#ff0000ff')).toBe('#ff0000');
    });

    it('lowercases strings without a hash prefix', () => {
        expect(normalizeHex('FF0000')).toBe('ff0000');
    });
});

describe('hexToRgb', () => {
    it('converts black', () => {
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('converts white', () => {
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('converts red', () => {
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('handles shorthand hex', () => {
        expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    });
});

describe('rgbToHex', () => {
    it('converts black', () => {
        expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('converts white', () => {
        expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    it('converts a known color', () => {
        expect(rgbToHex(0, 128, 255)).toBe('#0080ff');
    });

    it('clamps values outside 0-255', () => {
        expect(rgbToHex(300, -10, 128)).toBe('#ff0080');
    });
});

describe('rgbToHsv and hsvToRgb', () => {
    it('converts black', () => {
        const hsv = rgbToHsv(0, 0, 0);
        expect(hsv.h).toBeCloseTo(0);
        expect(hsv.s).toBeCloseTo(0);
        expect(hsv.v).toBeCloseTo(0);
    });

    it('converts white', () => {
        const hsv = rgbToHsv(255, 255, 255);
        expect(hsv.h).toBeCloseTo(0);
        expect(hsv.s).toBeCloseTo(0);
        expect(hsv.v).toBeCloseTo(100);
    });

    it('converts pure red', () => {
        const hsv = rgbToHsv(255, 0, 0);
        expect(hsv.h).toBeCloseTo(0);
        expect(hsv.s).toBeCloseTo(100);
        expect(hsv.v).toBeCloseTo(100);
    });

    it('converts pure green', () => {
        const hsv = rgbToHsv(0, 255, 0);
        expect(hsv.h).toBeCloseTo(120);
        expect(hsv.s).toBeCloseTo(100);
        expect(hsv.v).toBeCloseTo(100);
    });

    it('converts pure blue', () => {
        const hsv = rgbToHsv(0, 0, 255);
        expect(hsv.h).toBeCloseTo(240);
        expect(hsv.s).toBeCloseTo(100);
        expect(hsv.v).toBeCloseTo(100);
    });

    it('round-trips through hsvToRgb', () => {
        const original = { r: 100, g: 150, b: 200 };
        const hsv = rgbToHsv(original.r, original.g, original.b);
        const result = hsvToRgb(hsv.h, hsv.s, hsv.v);
        expect(result.r).toBeCloseTo(original.r, 0);
        expect(result.g).toBeCloseTo(original.g, 0);
        expect(result.b).toBeCloseTo(original.b, 0);
    });
});

describe('rgbToHsl and hslToRgb', () => {
    it('converts black', () => {
        const hsl = rgbToHsl(0, 0, 0);
        expect(hsl.h).toBeCloseTo(0);
        expect(hsl.s).toBeCloseTo(0);
        expect(hsl.l).toBeCloseTo(0);
    });

    it('converts white', () => {
        const hsl = rgbToHsl(255, 255, 255);
        expect(hsl.h).toBeCloseTo(0);
        expect(hsl.s).toBeCloseTo(0);
        expect(hsl.l).toBeCloseTo(100);
    });

    it('converts pure red', () => {
        const hsl = rgbToHsl(255, 0, 0);
        expect(hsl.h).toBeCloseTo(0);
        expect(hsl.s).toBeCloseTo(100);
        expect(hsl.l).toBeCloseTo(50);
    });

    it('converts a gray value with zero saturation', () => {
        const hsl = rgbToHsl(128, 128, 128);
        expect(hsl.s).toBeCloseTo(0);
    });

    it('hslToRgb returns gray for zero saturation', () => {
        const rgb = hslToRgb(0, 0, 50);
        expect(rgb.r).toBe(rgb.g);
        expect(rgb.g).toBe(rgb.b);
        expect(rgb.r).toBeCloseTo(128, 0);
    });

    it('round-trips through hslToRgb', () => {
        const original = { r: 80, g: 160, b: 220 };
        const hsl = rgbToHsl(original.r, original.g, original.b);
        const result = hslToRgb(hsl.h, hsl.s, hsl.l);
        expect(result.r).toBeCloseTo(original.r, 0);
        expect(result.g).toBeCloseTo(original.g, 0);
        expect(result.b).toBeCloseTo(original.b, 0);
    });
});
