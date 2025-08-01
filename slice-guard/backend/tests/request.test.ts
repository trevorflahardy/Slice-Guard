import { expect, test } from "bun:test";
import {
  createPrintRequest,
  getUserPrintRequests,
  createTag,
  setTagDefault,
  assignTag,
  unassignTag,
  getTagsForRequest,
  type PrintRequestRow,
  type RequestTagRow,
} from "../src/db/request";

function createMockSQL(result: any[] = []) {
  const fn: any = (strings: TemplateStringsArray, ...values: any[]) => {
    const query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""), "");
    fn.lastQuery = query;
    fn.lastParams = values;
    return Promise.resolve(result);
  };
  fn.lastQuery = null as string | null;
  fn.lastParams = null as any[] | null;
  return fn;
}

function normalize(sql: string | null) {
  return sql ? sql.replace(/\s+/g, " ").trim() : "";
}

function sampleRequest(): PrintRequestRow {
  return {
    id: 1,
    lab_id: 1,
    user_id: 2,
    title: "Title",
    file_data: new Uint8Array([1, 2, 3]),
    metadata: { a: 1 },
    description: "desc",
    is_closed: false,
    created_at: new Date(),
  };
}

function sampleTag(): RequestTagRow {
  return {
    id: 1,
    lab_id: 1,
    name: "Pending",
    color: "#fff",
    is_default: false,
    created_at: new Date(),
  };
}

test("createPrintRequest inserts expected values", async () => {
  const req = sampleRequest();
  const db = createMockSQL([req]);
  const result = await createPrintRequest(db as any, req.lab_id, req.user_id, req.file_data as any, req.metadata, req.title, req.description!);
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO lab.print_requests (lab_id, user_id, title, file_data, metadata, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, lab_id, user_id, title, file_data, metadata, description, is_closed, created_at"
  );
  expect(db.lastParams).toEqual([req.lab_id, req.user_id, req.title, req.file_data, JSON.stringify(req.metadata), req.description]);
  expect(result).toEqual(req);
});

test("getUserPrintRequests selects expected", async () => {
  const req = sampleRequest();
  const db = createMockSQL([req]);
  const result = await getUserPrintRequests(db as any, req.lab_id, req.user_id);
  expect(normalize(db.lastQuery)).toBe(
    "SELECT id, lab_id, user_id, title, file_data, metadata, description, is_closed, created_at FROM lab.print_requests WHERE lab_id = $1 AND user_id = $2"
  );
  expect(db.lastParams).toEqual([req.lab_id, req.user_id]);
  expect(result).toEqual([req]);
});

test("createTag inserts expected values", async () => {
  const tag = sampleTag();
  const db = createMockSQL([tag]);
  const result = await createTag(db as any, tag.lab_id, tag.name, tag.color, tag.is_default);
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO lab.request_tags (lab_id, name, color, is_default) VALUES ($1, $2, $3, $4) RETURNING id, lab_id, name, color, is_default, created_at"
  );
  expect(db.lastParams).toEqual([tag.lab_id, tag.name, tag.color, tag.is_default]);
  expect(result).toEqual(tag);
});

test("setTagDefault updates flag", async () => {
  const tag = sampleTag();
  const db = createMockSQL([tag]);
  const result = await setTagDefault(db as any, tag.id, true);
  expect(normalize(db.lastQuery)).toBe(
    "UPDATE lab.request_tags SET is_default = $1 WHERE id = $2 RETURNING id, lab_id, name, color, is_default, created_at"
  );
  expect(db.lastParams).toEqual([true, tag.id]);
  expect(result).toEqual(tag);
});

test("assignTag inserts mapping", async () => {
  const db = createMockSQL();
  await assignTag(db as any, 1, 2);
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO lab.request_tag_assignments (request_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"
  );
  expect(db.lastParams).toEqual([1, 2]);
});

test("unassignTag deletes mapping", async () => {
  const db = createMockSQL();
  await unassignTag(db as any, 1, 2);
  expect(normalize(db.lastQuery)).toBe(
    "DELETE FROM lab.request_tag_assignments WHERE request_id = $1 AND tag_id = $2"
  );
  expect(db.lastParams).toEqual([1, 2]);
});

test("getTagsForRequest selects join", async () => {
  const tag = sampleTag();
  const db = createMockSQL([tag]);
  const result = await getTagsForRequest(db as any, 1);
  expect(normalize(db.lastQuery)).toBe(
    "SELECT t.id, t.lab_id, t.name, t.color, t.is_default, t.created_at FROM lab.request_tag_assignments a JOIN lab.request_tags t ON a.tag_id = t.id WHERE a.request_id = $1"
  );
  expect(db.lastParams).toEqual([1]);
  expect(result).toEqual([tag]);
});
