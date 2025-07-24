import { expect, test } from "bun:test";
import { compressRequestFile, MAX_UPLOAD_SIZE } from "../src/utils/storage";
import { gzipSync } from "zlib";

const sample = new TextEncoder().encode("hello world");

test("compressRequestFile gzips the data", () => {
  const compressed = compressRequestFile(sample);
  const expected = gzipSync(sample);
  expect(compressed.equals(expected)).toBe(true);
});

test("compressRequestFile rejects large files", () => {
  const big = new Uint8Array(MAX_UPLOAD_SIZE + 1);
  expect(() => compressRequestFile(big)).toThrow();
});
