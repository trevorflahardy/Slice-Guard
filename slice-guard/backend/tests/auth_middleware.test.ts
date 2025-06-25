import { expect, test } from "bun:test";
import jwt from "jsonwebtoken";
import { ErrorCode } from "@slice-guard/shared/ws/errors";

process.env.JWT_SECRET = "test";
const { withAuth } = await import("../src/ws/handlers");

class DummyPayload {
  ws = {} as any;
  state = {} as any;
  logger = console as any;
}

test("withAuth denies invalid token", async () => {
  const handler = withAuth(async () => ({ op: 0 as any, d: {} }));
  const result = await handler({ ...new DummyPayload(), data: { d: { token: "bad" } } });
  expect(result).toBe(ErrorCode.UNAUTHORIZED);
});

test("withAuth passes userId", async () => {
  const token = jwt.sign({ id: 42 }, "test", { expiresIn: "1h" });
  let id: number | null = null;
  const handler = withAuth(async (p) => { id = p.userId; return { op: 0 as any, d: {} }; });
  await handler({ ...new DummyPayload(), data: { d: { token } } });
  expect(id).toBe(42);
});
