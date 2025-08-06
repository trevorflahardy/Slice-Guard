import type { SQL } from "bun";
import { listLabsForUser, listMembers, getMemberRoles } from "../db/lab";
import { getAllPrintRequests, getTagsForRequest, listTags } from "../db/lab/request";
import { findPublicUserById } from "../db/user";
import type { LabRole, LabMember } from "@shared/db/lab";
import type { LabState, MemberEvent, PrintRequestEvent } from "@shared/payloads/ws";
import type { RequestTag } from "@shared/db/request";

/**
 * Load the full lab state for all labs the user belongs to.
 */
export async function getUserLabStates(db: SQL, userId: number): Promise<LabState[]> {
  const labs = await listLabsForUser(db, userId);
  const result: LabState[] = [];

  for (const lab of labs) {
    // Load roles for the lab
    const roles: LabRole[] = await db`
      SELECT id, lab_id, name, permissions, created_at
        FROM lab.roles WHERE lab_id = ${lab.id}` as any;

    // Load members with their roles and public user info
    const memberRows = await listMembers(db, lab.id);
    const members: MemberEvent[] = [];
    for (const row of memberRows) {
      const user = await findPublicUserById(db, row.user_id);
      const mRoles = await getMemberRoles(db, lab.id, row.user_id);
      const member: LabMember = {
        lab_id: row.lab_id,
        user_id: row.user_id,
        roles: mRoles,
        joined_at: row.joined_at,
      };
      members.push({ labId: lab.id, member, user });
    }

    // Load tags for the lab
    const tags: RequestTag[] = await listTags(db, lab.id);

    // Load requests with their tags and user info
    const requestRows = await getAllPrintRequests(db, lab.id);
    const requests: PrintRequestEvent[] = [];
    for (const r of requestRows) {
      const user = await findPublicUserById(db, r.user_id);
      const rTags = await getTagsForRequest(db, r.id);
      requests.push({ request: r, user, tags: rTags });
    }

    result.push({ lab, roles, members, tags, requests });
  }

  return result;
}
