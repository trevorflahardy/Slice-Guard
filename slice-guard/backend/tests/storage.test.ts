import { expect, test } from "bun:test";
import { saveRequestFile, MAX_UPLOAD_SIZE } from "../src/utils/storage";
import { existsSync, rmSync, readFileSync } from "fs";

const dir = "slice-guard/backend/uploads/1";

function cleanup() {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}

cleanup();

const sample = new TextEncoder().encode("hello world");

test("saveRequestFile stores gzipped file", async () => {
  const path = await saveRequestFile(1, sample);
  expect(existsSync(path)).toBe(true);
  const contents = readFileSync(path);
  expect(contents.length).toBeGreaterThan(0);
});

test("saveRequestFile rejects large files", async () => {
  const big = new Uint8Array(MAX_UPLOAD_SIZE + 1);
  await expect(saveRequestFile(1, big)).rejects.toThrow();
});

cleanup();
