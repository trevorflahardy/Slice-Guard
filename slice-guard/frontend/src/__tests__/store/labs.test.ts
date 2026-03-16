import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLabsStore } from '../../store/labs';
import { useAuthStore } from '../../store/auth';
import type { LabState, PrintRequestEvent, MemberEvent } from '@shared/payloads/ws';
import type { Lab, LabRole, LabInvite, LabMember } from '@shared/db/lab';
import { LabPermission } from '@shared/db/lab';
import type { Channel } from '@shared/db/channel';
import type { RequestTag } from '@shared/db/request';
import type { User } from '@shared/db/user';
import type { Message } from '@shared/db/message';

// ---------------------------------------------------------------------------
// Sample data factories
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

function makeUser(overrides: Partial<User> = {}): User {
    return { id: 10, email: 'alice@example.com', name: 'Alice', avatar_url: null, created_at: new Date(now), ...overrides } as User;
}

function makeRole(overrides: Partial<LabRole> = {}): LabRole {
    return { id: 1, lab_id: 1, name: 'everyone', permissions: 3, rank: 0, color: null, created_at: new Date(now), ...overrides } as LabRole;
}

function makeLab(overrides: Partial<Lab> = {}): Lab {
    return { id: 1, owner_id: 10, name: 'Test Lab', description: null, icon_url: null, default_role_id: 1, created_at: new Date(now), ...overrides } as Lab;
}

function makeChannel(overrides: Partial<Channel> = {}): Channel {
    return { id: 1, type: 'text', category_id: null, lab_id: 1, name: 'general', description: null, request_id: null, position: 0, created_at: new Date(now), ...overrides } as Channel;
}

function makeMember(overrides: Partial<LabMember> = {}): LabMember {
    return { lab_id: 1, user_id: 10, roles: [makeRole()], joined_at: new Date(now), ...overrides } as LabMember;
}

function makeInvite(overrides: Partial<LabInvite> = {}): LabInvite {
    return { id: 1, lab_id: 1, code: 'abc123', max_uses: null, uses: 0, expires_at: null, created_at: new Date(now), ...overrides } as LabInvite;
}

function makeTag(overrides: Partial<RequestTag> = {}): RequestTag {
    return { id: 1, lab_id: 1, name: 'urgent', color: '#ff0000', is_default: false, created_at: new Date(now), ...overrides } as RequestTag;
}

function makeMessage(overrides: Partial<Message> = {}): Message {
    return { id: 1, channel_id: 1, user_id: 10, content: 'hello', user_mentions: [], role_mentions: [], created_at: new Date(now), edited_at: null, ...overrides } as Message;
}

function makePrintRequestEvent(overrides: Partial<PrintRequestEvent> = {}): PrintRequestEvent {
    return {
        request: { id: 1, lab_id: 1, user_id: 10, title: 'Print Job', description: null, file_data: new Uint8Array(), metadata: null, is_closed: false, created_at: new Date(now) },
        user: makeUser(),
        tags: [],
        ...overrides,
    } as PrintRequestEvent;
}

function sampleLabState(overrides: Partial<LabState> = {}): LabState {
    return {
        lab: makeLab(),
        roles: [makeRole()],
        members: [{ labId: 1, member: makeMember(), user: makeUser() } as MemberEvent],
        tags: [],
        requests: [],
        invites: [],
        permissions: 3,
        channels: [makeChannel()],
        messages: {},
        ...overrides,
    };
}

/** Set up auth store with a user so permission checks work. */
function setAuthUser(userId: number = 10) {
    const auth = useAuthStore();
    auth.setSession('test-key', makeUser({ id: userId }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('labs store', () => {
    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    // -----------------------------------------------------------------------
    // setInitial
    // -----------------------------------------------------------------------
    describe('setInitial', () => {
        it('populates labs, channels, roles, members, invites, tags, requests, permissions', () => {
            const store = useLabsStore();
            const invite = makeInvite();
            const tag = makeTag();
            const reqEvent = makePrintRequestEvent();

            store.setInitial([
                sampleLabState({
                    invites: [invite],
                    tags: [tag],
                    requests: [reqEvent],
                    permissions: 7,
                    messages: { 1: [makeMessage()] },
                }),
            ]);

            expect(store.labs.size).toBe(1);
            expect(store.labs.get(1)!.name).toBe('Test Lab');

            expect(store.channels.get(1)!.size).toBe(1);
            expect(store.channels.get(1)!.get(1)!.name).toBe('general');

            expect(store.roles.get(1)!.size).toBe(1);
            expect(store.roles.get(1)!.get(1)!.name).toBe('everyone');

            expect(store.members.get(1)!.size).toBe(1);
            expect(store.members.get(1)!.get(10)!.user_id).toBe(10);

            expect(store.invites.get(1)!.size).toBe(1);
            expect(store.invites.get(1)!.get(1)!.code).toBe('abc123');

            expect(store.tags.get(1)!.size).toBe(1);
            expect(store.tags.get(1)!.get(1)!.name).toBe('urgent');

            expect(store.requests.get(1)!.length).toBe(1);
            expect(store.requests.get(1)![0].request.id).toBe(1);

            // Messages populated
            expect(store.messages.get(1)!.get(1)!.length).toBe(1);

            // channelToLab reverse lookup
            expect(store.channelToLab.get(1)).toBe(1);

            // Users cache
            expect(store.users.get(10)!.email).toBe('alice@example.com');
        });

        it('clears existing state before populating', () => {
            const store = useLabsStore();
            store.setInitial([sampleLabState()]);
            expect(store.labs.size).toBe(1);

            // Call again with a different lab
            store.setInitial([
                sampleLabState({
                    lab: makeLab({ id: 2, name: 'New Lab' }),
                    channels: [makeChannel({ id: 5, lab_id: 2 })],
                    roles: [makeRole({ id: 5, lab_id: 2 })],
                    members: [{ labId: 2, member: makeMember({ lab_id: 2 }), user: makeUser() } as MemberEvent],
                }),
            ]);

            expect(store.labs.size).toBe(1);
            expect(store.labs.has(1)).toBe(false);
            expect(store.labs.get(2)!.name).toBe('New Lab');
        });
    });

    // -----------------------------------------------------------------------
    // addLab / updateLab / removeLab
    // -----------------------------------------------------------------------
    describe('addLab', () => {
        it('adds a new lab to the store', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            expect(store.labs.get(1)!.name).toBe('Test Lab');
            expect(store.getLabChannels(1).length).toBe(1);
            expect(store.getLabRoles(1).length).toBe(1);
            expect(store.getLabMembers(1).length).toBe(1);
        });
    });

    describe('updateLab', () => {
        it('updates lab info', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            store.updateLab(makeLab({ id: 1, name: 'Renamed Lab' }));
            expect(store.labs.get(1)!.name).toBe('Renamed Lab');
        });

        it('does nothing for unknown lab', () => {
            const store = useLabsStore();
            store.updateLab(makeLab({ id: 99, name: 'Ghost' }));
            expect(store.labs.has(99)).toBe(false);
        });
    });

    describe('removeLab', () => {
        it('removes lab and all associated data', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ invites: [makeInvite()], tags: [makeTag()] }));
            expect(store.labs.size).toBe(1);

            store.removeLab(1);

            expect(store.labs.size).toBe(0);
            expect(store.channels.has(1)).toBe(false);
            expect(store.roles.has(1)).toBe(false);
            expect(store.members.has(1)).toBe(false);
            expect(store.invites.has(1)).toBe(false);
            expect(store.tags.has(1)).toBe(false);
            expect(store.requests.has(1)).toBe(false);
            expect(store.messages.has(1)).toBe(false);
            expect(store.permissions.has(1)).toBe(false);
            expect(store.channelToLab.has(1)).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // Channels
    // -----------------------------------------------------------------------
    describe('addChannel', () => {
        it('adds a channel to an existing lab', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            const ch = makeChannel({ id: 2, name: 'random' });
            store.addChannel(1, ch);

            expect(store.channels.get(1)!.get(2)!.name).toBe('random');
            expect(store.channelToLab.get(2)).toBe(1);
            // Initializes empty messages array
            expect(store.messages.get(1)!.get(2)).toEqual([]);
        });
    });

    describe('updateChannel', () => {
        it('updates an existing channel', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            store.updateChannel(1, makeChannel({ id: 1, name: 'announcements' }));
            expect(store.channels.get(1)!.get(1)!.name).toBe('announcements');
        });

        it('does nothing for unknown channel', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());
            store.updateChannel(1, makeChannel({ id: 99, name: 'nope' }));
            expect(store.channels.get(1)!.has(99)).toBe(false);
        });
    });

    describe('removeChannel', () => {
        it('removes channel, reverse lookup, and messages', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ messages: { 1: [makeMessage()] } }));

            store.removeChannel(1, 1);

            expect(store.channels.get(1)!.has(1)).toBe(false);
            expect(store.channelToLab.has(1)).toBe(false);
            expect(store.messages.get(1)!.has(1)).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // Requests
    // -----------------------------------------------------------------------
    describe('addRequest', () => {
        it('prepends request to the list', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ requests: [makePrintRequestEvent({ request: { id: 1, lab_id: 1, user_id: 10, title: 'First', description: null, file_data: new Uint8Array(), metadata: null, is_closed: false, created_at: new Date(now) } })] }));

            const newReq = makePrintRequestEvent({ request: { id: 2, lab_id: 1, user_id: 10, title: 'Second', description: null, file_data: new Uint8Array(), metadata: null, is_closed: false, created_at: new Date(now) } });
            store.addRequest(1, newReq);

            const requests = store.requests.get(1)!;
            expect(requests.length).toBe(2);
            expect(requests[0].request.id).toBe(2); // prepended
            expect(requests[1].request.id).toBe(1);
        });

        it('caches the user from the request event', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());
            const user = makeUser({ id: 20, name: 'Bob' });
            store.addRequest(1, makePrintRequestEvent({ user }));
            expect(store.users.get(20)!.name).toBe('Bob');
        });
    });

    describe('updateRequest', () => {
        it('updates a request in place', () => {
            const store = useLabsStore();
            const req = makePrintRequestEvent();
            store.addLab(sampleLabState({ requests: [req] }));

            const updated = makePrintRequestEvent({ request: { ...req.request, title: 'Updated' } });
            store.updateRequest(1, updated);

            expect(store.requests.get(1)![0].request.title).toBe('Updated');
        });
    });

    describe('removeRequest', () => {
        it('removes a request by id', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ requests: [makePrintRequestEvent()] }));
            expect(store.requests.get(1)!.length).toBe(1);

            store.removeRequest(1, 1);
            expect(store.requests.get(1)!.length).toBe(0);
        });
    });

    // -----------------------------------------------------------------------
    // Tags
    // -----------------------------------------------------------------------
    describe('addTag', () => {
        it('adds a tag to the lab', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            store.addTag(1, makeTag({ id: 5, name: 'review' }));
            expect(store.tags.get(1)!.get(5)!.name).toBe('review');
        });
    });

    describe('updateTag', () => {
        it('updates an existing tag', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ tags: [makeTag()] }));

            store.updateTag(1, makeTag({ id: 1, name: 'critical' }));
            expect(store.tags.get(1)!.get(1)!.name).toBe('critical');
        });

        it('does nothing for unknown tag', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());
            store.updateTag(1, makeTag({ id: 99 }));
            expect(store.tags.get(1)!.has(99)).toBe(false);
        });
    });

    describe('removeTag', () => {
        it('removes the tag from the lab', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ tags: [makeTag()] }));

            store.removeTag(1, 1);
            expect(store.tags.get(1)!.has(1)).toBe(false);
        });

        it('strips the tag from all requests in the lab', () => {
            const store = useLabsStore();
            const tag = makeTag({ id: 3 });
            const req = makePrintRequestEvent({ tags: [tag, makeTag({ id: 4, name: 'keep' })] });
            store.addLab(sampleLabState({ tags: [tag], requests: [req] }));

            store.removeTag(1, 3);

            const tags = store.requests.get(1)![0].tags;
            expect(tags.length).toBe(1);
            expect(tags[0].id).toBe(4);
        });
    });

    // -----------------------------------------------------------------------
    // Members
    // -----------------------------------------------------------------------
    describe('addMember', () => {
        it('adds a member to the lab and caches the user', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            const newUser = makeUser({ id: 20, name: 'Bob' });
            const event: MemberEvent = {
                labId: 1,
                member: makeMember({ user_id: 20, roles: [] }),
                user: newUser,
            };
            store.addMember(1, event);

            expect(store.members.get(1)!.has(20)).toBe(true);
            expect(store.users.get(20)!.name).toBe('Bob');
        });
    });

    describe('removeMember', () => {
        it('removes a member by user id', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());
            expect(store.members.get(1)!.has(10)).toBe(true);

            store.removeMember(1, 10);
            expect(store.members.get(1)!.has(10)).toBe(false);
        });
    });

    describe('handleMemberLeft', () => {
        it('removes the member from the lab', () => {
            const store = useLabsStore();
            setAuthUser(99); // different user
            store.addLab(sampleLabState());

            store.handleMemberLeft(1, 10);
            expect(store.members.get(1)!.has(10)).toBe(false);
        });

        it('removes the entire lab when the current user leaves', () => {
            const store = useLabsStore();
            setAuthUser(10);
            store.addLab(sampleLabState());
            expect(store.labs.has(1)).toBe(true);

            store.handleMemberLeft(1, 10);
            expect(store.labs.has(1)).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // Roles
    // -----------------------------------------------------------------------
    describe('addRole', () => {
        it('adds a role to the lab', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            const role = makeRole({ id: 2, name: 'admin', permissions: 7, rank: 1 });
            store.addRole(1, role);

            expect(store.roles.get(1)!.get(2)!.name).toBe('admin');
        });

        it('updates the role on members who already have it', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            // Member already has role id=1; update its name via addRole
            const updatedRole = makeRole({ id: 1, name: 'updated-everyone', permissions: 15 });
            store.addRole(1, updatedRole);

            const memberRoles = store.members.get(1)!.get(10)!.roles;
            expect(memberRoles[0].name).toBe('updated-everyone');
        });
    });

    describe('updateRole', () => {
        it('updates an existing role', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            store.updateRole(1, makeRole({ id: 1, name: 'modified' }));
            expect(store.roles.get(1)!.get(1)!.name).toBe('modified');
        });

        it('does nothing for unknown role', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());
            store.updateRole(1, makeRole({ id: 99 }));
            expect(store.roles.get(1)!.has(99)).toBe(false);
        });
    });

    describe('removeRole', () => {
        it('removes the role from the lab', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            store.removeRole(1, 1);
            expect(store.roles.get(1)!.has(1)).toBe(false);
        });

        it('strips the role from all member role lists', () => {
            const store = useLabsStore();
            const extraRole = makeRole({ id: 2, name: 'admin', rank: 1 });
            const member = makeMember({ roles: [makeRole(), extraRole] });
            store.addLab(
                sampleLabState({
                    roles: [makeRole(), extraRole],
                    members: [{ labId: 1, member, user: makeUser() } as MemberEvent],
                }),
            );

            store.removeRole(1, 1);

            const memberRoles = store.members.get(1)!.get(10)!.roles;
            expect(memberRoles.length).toBe(1);
            expect(memberRoles[0].id).toBe(2);
        });
    });

    // -----------------------------------------------------------------------
    // Invites
    // -----------------------------------------------------------------------
    describe('addInvite', () => {
        it('adds an invite to the lab', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            store.addInvite(1, makeInvite({ id: 5, code: 'xyz' }));
            expect(store.invites.get(1)!.get(5)!.code).toBe('xyz');
        });
    });

    describe('updateInvite', () => {
        it('updates an existing invite', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ invites: [makeInvite()] }));

            store.updateInvite(1, makeInvite({ id: 1, uses: 5 }));
            expect(store.invites.get(1)!.get(1)!.uses).toBe(5);
        });

        it('does nothing for unknown invite', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());
            store.updateInvite(1, makeInvite({ id: 99 }));
            expect(store.invites.get(1)!.has(99)).toBe(false);
        });
    });

    describe('removeInvite', () => {
        it('removes an invite by id', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ invites: [makeInvite()] }));

            store.removeInvite(1, 1);
            expect(store.invites.get(1)!.has(1)).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // Messages
    // -----------------------------------------------------------------------
    describe('addMessage', () => {
        it('appends a message to the channel', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ messages: { 1: [makeMessage()] } }));

            store.addMessage(1, makeMessage({ id: 2, content: 'world' }));

            const msgs = store.messages.get(1)!.get(1)!;
            expect(msgs.length).toBe(2);
            expect(msgs[1].content).toBe('world');
        });

        it('creates channel message list if it does not exist', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            store.addMessage(1, makeMessage({ id: 5, content: 'first' }));
            expect(store.messages.get(1)!.get(1)!.length).toBe(1);
        });
    });

    describe('updateMessage', () => {
        it('updates a message in place', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ messages: { 1: [makeMessage()] } }));

            store.updateMessage(1, makeMessage({ id: 1, content: 'edited' }));
            expect(store.messages.get(1)!.get(1)![0].content).toBe('edited');
        });
    });

    describe('removeMessage', () => {
        it('removes a message from the channel', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState({ messages: { 1: [makeMessage(), makeMessage({ id: 2 })] } }));

            store.removeMessage(1, 1);

            const msgs = store.messages.get(1)!.get(1)!;
            expect(msgs.length).toBe(1);
            expect(msgs[0].id).toBe(2);
        });
    });

    // -----------------------------------------------------------------------
    // getLabPermissions
    // -----------------------------------------------------------------------
    describe('getLabPermissions', () => {
        it('returns ALL for the lab owner', () => {
            const store = useLabsStore();
            setAuthUser(10);
            store.addLab(sampleLabState({ lab: makeLab({ owner_id: 10 }) }));

            expect(store.getLabPermissions(1)).toBe(LabPermission.ALL);
        });

        it('returns 0 when there is no authenticated user', () => {
            const store = useLabsStore();
            store.addLab(sampleLabState());

            // No auth user set
            expect(store.getLabPermissions(1)).toBe(0);
        });

        it('computes permissions from member roles for non-owner', () => {
            const store = useLabsStore();
            setAuthUser(20);
            const role = makeRole({ permissions: LabPermission.CREATE_REQUEST | LabPermission.READ });
            const member = makeMember({ user_id: 20, roles: [role] });
            store.addLab(
                sampleLabState({
                    lab: makeLab({ owner_id: 99 }), // owner is someone else
                    members: [{ labId: 1, member, user: makeUser({ id: 20 }) } as MemberEvent],
                }),
            );

            const perms = store.getLabPermissions(1);
            expect(perms & LabPermission.CREATE_REQUEST).toBeTruthy();
            expect(perms & LabPermission.READ).toBeTruthy();
        });
    });
});
