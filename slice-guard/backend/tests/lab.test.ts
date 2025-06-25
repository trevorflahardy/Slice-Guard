import { expect, test } from "bun:test";
import {
  createLab,
  deleteLab,
  updateLab,
  createRole,
  addMember,
  removeMember,
  getMemberRolePermissions,
  type LabRow,
  type LabRoleRow,
  type LabMemberRow,
} from "../src/db/lab";

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

function sampleLab(): LabRow {
  return {
    id: 1,
    owner_id: 2,
    name: "Test Lab",
    description: "Desc",
    image_url: "img",
    created_at: new Date(),
  };
}

function sampleRole(): LabRoleRow {
  return {
    id: 1,
    lab_id: 1,
    name: "Role",
    permissions: 1,
    created_at: new Date(),
  };
}

function sampleMember(): LabMemberRow {
  return {
    lab_id: 1,
    user_id: 2,
    role_id: 1,
    joined_at: new Date(),
  };
}

test("createLab inserts expected values", async () => {
  const lab = sampleLab();
  const db = new MockDB([lab]);
  const result = await createLab(db as any, lab.owner_id, lab.name, lab.description!, lab.image_url!);
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO lab.labs (owner_id, name, description, image_url) VALUES ($1, $2, $3, $4) RETURNING id, owner_id, name, description, image_url, created_at"
  );
  expect(db.lastParams).toEqual([lab.owner_id, lab.name, lab.description, lab.image_url]);
  expect(result).toEqual(lab);
});

test("deleteLab deletes by id", async () => {
  const db = new MockDB();
  await deleteLab(db as any, 1);
  expect(normalize(db.lastQuery)).toBe("DELETE FROM lab.labs WHERE id = $1");
  expect(db.lastParams).toEqual([1]);
});

test("updateLab updates fields", async () => {
  const lab = sampleLab();
  const db = new MockDB([lab]);
  const result = await updateLab(db as any, lab.id, lab.name, lab.description!, lab.image_url!);
  expect(normalize(db.lastQuery)).toBe(
    "UPDATE lab.labs SET name = $2, description = $3, image_url = $4 WHERE id = $1 RETURNING id, owner_id, name, description, image_url, created_at"
  );
  expect(db.lastParams).toEqual([lab.id, lab.name, lab.description, lab.image_url]);
  expect(result).toEqual(lab);
});

test("createRole inserts expected values", async () => {
  const role = sampleRole();
  const db = new MockDB([role]);
  const result = await createRole(db as any, role.lab_id, role.name, role.permissions as number);
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO lab.roles (lab_id, name, permissions) VALUES ($1, $2, $3) RETURNING id, lab_id, name, permissions, created_at"
  );
  expect(db.lastParams).toEqual([role.lab_id, role.name, role.permissions]);
  expect(result).toEqual(role);
});

test("addMember inserts expected values", async () => {
  const m = sampleMember();
  const db = new MockDB([m]);
  const result = await addMember(db as any, m.lab_id, m.user_id, m.role_id!);
  expect(normalize(db.lastQuery)).toBe(
    "INSERT INTO lab.members (lab_id, user_id, role_id) VALUES ($1, $2, $3) RETURNING lab_id, user_id, role_id, joined_at"
  );
  expect(db.lastParams).toEqual([m.lab_id, m.user_id, m.role_id]);
  expect(result).toEqual(m);
});

test("removeMember deletes by composite id", async () => {
  const db = new MockDB();
  await removeMember(db as any, 1, 2);
  expect(normalize(db.lastQuery)).toBe(
    "DELETE FROM lab.members WHERE lab_id = $1 AND user_id = $2"
  );
  expect(db.lastParams).toEqual([1, 2]);
});

test("getMemberRolePermissions selects join", async () => {
  const db = new MockDB([{ permissions: 8 }]);
  const result = await getMemberRolePermissions(db as any, 1, 2);
  expect(normalize(db.lastQuery)).toBe(
    "SELECT r.permissions FROM lab.members m JOIN lab.roles r ON m.role_id = r.id WHERE m.lab_id = $1 AND m.user_id = $2"
  );
  expect(db.lastParams).toEqual([1, 2]);
  expect(result).toEqual(8);
});
