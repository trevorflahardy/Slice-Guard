import { expect, test } from "bun:test";
import { authenticate } from "../src/http/middleware";

const lookup = async (_db: any, key: string) => {
  if (key === "good") return { user_id: 1 } as any;
  return null;
};

class DummyState {
  db = {} as any;
  logger = { child: () => ({ debug() {} }) } as any;
}

const state = new DummyState() as any;

test("authenticate rejects missing header", async () => {
  const req = new Request("http://test");
  const id = await authenticate(req, state, lookup);
  expect(id).toBeNull();
});

test("authenticate returns user id", async () => {
  const req = new Request("http://test", { headers: { Authorization: "ApiKey good" } });
  const id = await authenticate(req, state, lookup);
  expect(id).toBe(1);
});
