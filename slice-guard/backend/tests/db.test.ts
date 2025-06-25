import { expect, test } from "bun:test";
import {
  createUser,
  deleteRefreshToken,
  deleteTokensForUser,
  findUserByEmail,
  findUserById,
  insertRefreshToken,
  getRefreshToken,
  type UserWithPassword,
  type RefreshTokenRow,
} from "../src/db/user";

class MockDB {
  public lastQuery: string | null = null;
  public lastParams: any[] | null = null;
  private result: any[];

  constructor(result: any[] = []) {
    this.result = result;
  }

  async query<T>(sql: string, params: any[]): Promise<T[]> {
    this.lastQuery = sql;
    this.lastParams = params;
    return this.result as T[];
  }

  async run(sql: string, params: any[]): Promise<void> {
    this.lastQuery = sql;
    this.lastParams = params;
  }
}

function normalize(sql: string | null) {
  return sql ? sql.replace(/\s+/g, " ").trim() : "";
}

function sampleUser(): UserWithPassword {
  return {
    id: 1,
    email: "test@example.com",
    name: "Tester",
    created_at: new Date(),
    password_hash: "hashed",
  };
}

function sampleTokenRow(): RefreshTokenRow {
  return {
    id: 1,
    user_id: 1,
    token: "abc",
    created_at: new Date(),
    expires_at: new Date(Date.now() + 1000),
  };
}

test("findUserByEmail uses expected SQL", async () => {
  const row = sampleUser();
  const db = new MockDB([row]);
  const result = await findUserByEmail(db as any, "test@example.com");
  expect(normalize(db.lastQuery)).toBe(
    "SELECT id, email, name, created_at, password_hash FROM auth.users WHERE email = $1"
  );
  expect(db.lastParams).toEqual(["test@example.com"]);
  expect(result).toEqual(row);
});

test("findUserById uses expected SQL", async () => {
  const row = sampleUser();
  const db = new MockDB([row]);
  const result = await findUserById(db as any, 1);
  expect(normalize(db.lastQuery)).toBe(
    "SELECT id, email, name, created_at, password_hash FROM auth.users WHERE id = $1"
  );
  expect(db.lastParams).toEqual([1]);
  expect(result).toEqual(row);
});

test("createUser inserts with expected values", async () => {
  const row = sampleUser();
  const db = new MockDB([row]);
  const result = await createUser(db as any, row.email, row.password_hash, row.name!);
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO auth.users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at, password_hash"
  );
  expect(db.lastParams).toEqual([row.email, row.password_hash, row.name]);
  expect(result).toEqual(row);
});

test("insertRefreshToken uses expected SQL", async () => {
  const token = sampleTokenRow();
  const db = new MockDB([token]);
  const result = await insertRefreshToken(db as any, token.user_id, token.token, token.expires_at);
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO auth.refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id, user_id, token, created_at, expires_at"
  );
  expect(db.lastParams).toEqual([token.user_id, token.token, token.expires_at]);
  expect(result).toEqual(token);
});

test("getRefreshToken selects expected SQL", async () => {
  const token = sampleTokenRow();
  const db = new MockDB([token]);
  const result = await getRefreshToken(db as any, token.token);
  expect(normalize(db.lastQuery)).toBe(
    "SELECT id, user_id, token, created_at, expires_at FROM auth.refresh_tokens WHERE token = $1"
  );
  expect(db.lastParams).toEqual([token.token]);
  expect(result).toEqual(token);
});

test("deleteRefreshToken deletes by token", async () => {
  const db = new MockDB();
  await deleteRefreshToken(db as any, "abc");
  expect(normalize(db.lastQuery)).toBe(
    "DELETE FROM auth.refresh_tokens WHERE token = $1"
  );
  expect(db.lastParams).toEqual(["abc"]);
});

test("deleteTokensForUser deletes all for user", async () => {
  const db = new MockDB();
  await deleteTokensForUser(db as any, 2);
  expect(normalize(db.lastQuery)).toBe(
    "DELETE FROM auth.refresh_tokens WHERE user_id = $1"
  );
  expect(db.lastParams).toEqual([2]);
});
