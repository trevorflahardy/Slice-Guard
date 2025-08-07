import { expect, test } from 'bun:test';
import { Parser } from '../src/three-parser';
import { resolve } from 'path';

const file = resolve(__dirname, './slices/benchy_sliced.3mf');

test('extract plates from 3mf', async () => {
    const parser = new Parser(file);
    await parser.unpack();
    const plates = await parser.extractPlates();
    expect(plates.length).toBe(1);
    expect(plates[0].platerId).toBe('1');
    await parser.cleanup();
});

test('project settings loads', async () => {
    const parser = new Parser(file);
    await parser.unpack();
    const settings = await parser.getProjectSettings();
    expect(settings).toBeTruthy();
    await parser.cleanup();
});
