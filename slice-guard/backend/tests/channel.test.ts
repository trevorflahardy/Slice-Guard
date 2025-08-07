import { expect, test } from "bun:test";
import { createChannel } from "../src/db/lab/channel";
import { createMessage } from "../src/db/lab/message";
import { ChannelType } from "@shared/db/channel";

function createMockSQL(result: any[] = []) {
  const fn: any = (strings: TemplateStringsArray, ...values: any[]) => {
    const query = strings.reduce(
      (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
      ""
    );
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

test("createChannel uses expected SQL", async () => {
  const row = {
    id: 1,
    type: ChannelType.TEXT,
    category_id: null,
    lab_id: 1,
    name: "general",
    description: null,
    request_id: null,
    position: 0,
    created_at: new Date(),
  };
  const db = createMockSQL([row]);
  const result = await createChannel(db as any, ChannelType.TEXT, "general", 0, 1);
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO lab.channels (type, category_id, lab_id, name, description, request_id, position) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, type, category_id, lab_id, name, description, request_id, position, created_at"
  );
  expect(db.lastParams).toEqual([ChannelType.TEXT, null, 1, "general", null, null, 0]);
  expect(result).toEqual(row);
});

test("createMessage uses expected SQL", async () => {
  const row = {
    id: 1,
    channel_id: 2,
    user_id: 3,
    content: "hello",
    user_mentions: [],
    role_mentions: [],
    created_at: new Date(),
    edited_at: null,
  };
  const db = createMockSQL([row]);
  const result = await createMessage(db as any, 2, 3, "hello");
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO lab.messages (channel_id, user_id, content, user_mentions, role_mentions) VALUES ($1, $2, $3, $4, $5) RETURNING id, channel_id, user_id, content, user_mentions, role_mentions, created_at, edited_at"
  );
  expect(db.lastParams).toEqual([2, 3, "hello", [], []]);
  expect(result).toEqual(row);
});
