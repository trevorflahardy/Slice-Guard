import { expect, test } from "bun:test";
import { assignTagRoute } from "../src/http/request";

function createMockSQL(results: any[] = []) {
  const fn: any = (strings: TemplateStringsArray, ...values: any[]) => {
    const query = strings.reduce(
      (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
      "",
    );
    fn.queries.push(query);
    fn.params.push(values);
    const res = results.length ? results.shift() : [];
    return Promise.resolve(res);
  };
  fn.queries = [] as string[];
  fn.params = [] as any[][];
  return fn;
}

test("assignTagRoute denies non-owner without manage permission", async () => {
  const now = new Date();
  const db = createMockSQL([
    [{ id: 1, user_id: 1, key: "abc", created_at: now }], // getApiKey
    [{
      id: 1,
      lab_id: 1,
      user_id: 2,
      title: "",
      file_data: new Uint8Array(),
      metadata: {},
      description: null,
      is_closed: false,
      created_at: now,
    }], // getPrintRequestById
    [{ owner_id: 3 }], // getMemberRolePermissions owner check
    [], // getMemberRolePermissions role perms (no roles)
  ]);
  const logger = { child: () => logger, debug: () => {} } as any;
  const state = { db: db as any, logger, broadcast: () => {} } as any;

  const req = new Request("http://localhost/api/labs/1/requests/1/tags/1", {
    method: "POST",
    headers: { authorization: "apikey abc" },
    body: JSON.stringify({ assign: true }),
  });

  const res = await assignTagRoute(req, state, {
    labId: "1",
    requestId: "1",
    tagId: "1",
  });
  expect(res.status).toBe(403);
});
