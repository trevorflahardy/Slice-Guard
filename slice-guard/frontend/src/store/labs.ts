import { defineStore } from 'pinia';
import type { RequestTag } from '@shared/db/request';
import type { LabState, PrintRequestEvent, MemberEvent } from '@shared/payloads/ws';
import type { LabInvite, LabRole, Lab, LabMember } from '@shared/db/lab';
import type { Channel } from '@shared/db/channel';
import type { User } from '@shared/db/user';
import type { Message } from '@shared/db/message';
import { useAuthStore } from './auth';

const DEV = import.meta.env.DEV;

type LabId = number;
type ChannelId = number;
type UserId = number;
type RoleId = number;
type InviteId = number;
type TagId = number;
type MemberId = number;
type RequestId = number;
type MessageId = number;

/**
 * Central store holding all lab related state with O(1) lookups.
 * Uses Maps for efficient access patterns.
 */
export const useLabsStore = defineStore('labs', {
    state: () => ({
        // Core lab data
        labs: new Map<LabId, Lab>(),

        // Lab-scoped data indexed by labId
        channels: new Map<LabId, Map<ChannelId, Channel>>(),
        roles: new Map<LabId, Map<RoleId, LabRole>>(),
        members: new Map<LabId, Map<UserId, LabMember>>(),
        invites: new Map<LabId, Map<InviteId, LabInvite>>(),
        tags: new Map<LabId, Map<TagId, RequestTag>>(),
        requests: new Map<LabId, PrintRequestEvent[]>(),
        messages: new Map<LabId, Map<ChannelId, Message[]>>(), // labId -> channelId -> messages[]
        permissions: new Map<LabId, number>(), // labId -> permissions bitmask

        // Global lookups for convenience
        channelToLab: new Map<ChannelId, LabId>(), // channelId -> labId
        users: new Map<UserId, User>(), // userId -> User
    }),

    getters: {
        /** Get all labs as array */
        allLabs: (state) => Array.from(state.labs.values()),

        /** Get channels for a lab as array */
        getLabChannels: (state) => (labId: LabId) => {
            const channels = state.channels.get(labId);
            return channels ? Array.from(channels.values()) : [];
        },

        /** Get roles for a lab as array */
        getLabRoles: (state) => (labId: LabId) => {
            const roles = state.roles.get(labId);
            return roles ? Array.from(roles.values()) : [];
        },

        /** Get members for a lab as array */
        getLabMembers: (state) => (labId: LabId) => {
            const members = state.members.get(labId);
            return members ? Array.from(members.values()) : [];
        },

        /** Get a user by id */
        getUser: (state) => (userId: UserId) => {
            return state.users.get(userId) || null;
        },

        /** Get invites for a lab as array */
        getLabInvites: (state) => (labId: LabId) => {
            const invites = state.invites.get(labId);
            return invites ? Array.from(invites.values()) : [];
        },

        /** Get tags for a lab as array */
        getLabTags: (state) => (labId: LabId) => {
            const tags = state.tags.get(labId);
            return tags ? Array.from(tags.values()) : [];
        },

        /** Get requests for a lab */
        getLabRequests: (state) => (labId: LabId) => {
            return state.requests.get(labId) || [];
        },

        /** Get permissions for a lab */
        getLabPermissions: (state) => (labId: LabId) => {
            return state.permissions.get(labId) || 0;
        },
    },

    actions: {
        /** Initialize store with labs from server. */
        setInitial(labStates: LabState[]) {
            if (DEV) {
                console.debug('[labs] setInitial', labStates);
            }

            // Clear existing state
            this.labs.clear();
            this.channels.clear();
            this.roles.clear();
            this.members.clear();
            this.invites.clear();
            this.tags.clear();
            this.requests.clear();
            this.messages.clear();
            this.permissions.clear();
            this.channelToLab.clear();
            this.users.clear();

            // Populate from LabState array
            for (const labState of labStates) {
                this.addLab(labState);
            }
        },

        /** Get a lab by id. */
        getLab(id: number): Lab | null {
            return this.labs.get(id) || null;
        },

        /** Find a channel by id across all labs. */
        getChannel(id: number): Channel | null {
            const labId = this.channelToLab.get(id);
            if (!labId) {
                return null;
            }
            const channels = this.channels.get(labId);
            return channels?.get(id) || null;
        },

        /** Add a new lab to the store. */
        addLab(labState: LabState) {
            if (DEV) {
                console.debug('[labs] addLab', labState);
            }

            const labId = labState.lab.id;

            // Store lab
            this.labs.set(labId, labState.lab);

            // Store channels
            const channelsMap = new Map<ChannelId, Channel>();
            for (const channel of labState.channels) {
                channelsMap.set(channel.id, channel);
                this.channelToLab.set(channel.id, labId);
            }
            this.channels.set(labId, channelsMap);

            // Store roles
            const rolesMap = new Map<RoleId, LabRole>();
            for (const role of labState.roles) {
                rolesMap.set(role.id, role);
            }
            this.roles.set(labId, rolesMap);

            // Store members and cache users
            const membersMap = new Map<MemberId, LabMember>();
            for (const member of labState.members) {
                if (member.user) {
                    this.users.set(member.user.id, member.user);
                }
                membersMap.set(member.member.user_id, member.member);
            }
            this.members.set(labId, membersMap);

            // Store invites
            const invitesMap = new Map<InviteId, LabInvite>();
            for (const invite of labState.invites) {
                invitesMap.set(invite.id, invite);
            }
            this.invites.set(labId, invitesMap);

            // Store tags
            const tagsMap = new Map<TagId, RequestTag>();
            for (const tag of labState.tags) {
                tagsMap.set(tag.id, tag);
            }
            this.tags.set(labId, tagsMap);

            // Store requests and cache request authors
            for (const req of labState.requests) {
                if (req.user) {
                    this.users.set(req.user.id, req.user);
                }
            }
            this.requests.set(labId, labState.requests);

            // Initialize messages map
            const messagesMap = new Map<ChannelId, Message[]>();
            for (const [channelId, messages] of Object.entries(labState.messages)) {
                messagesMap.set(Number(channelId), messages);
            }
            this.messages.set(labId, messagesMap);

            // Store permissions
            this.permissions.set(labId, labState.permissions || 0);
        },

        /** Update basic lab info. */
        updateLab(lab: Lab) {
            if (!this.labs.has(lab.id)) {
                return;
            }
            if (DEV) {
                console.debug('[labs] updateLab', lab);
            }
            this.labs.set(lab.id, lab);
        },

        /** Remove a lab entirely. */
        removeLab(labId: LabId) {
            if (DEV) {
                console.debug('[labs] removeLab', labId);
            }

            // Remove channels from global lookup
            const channels = this.channels.get(labId);
            if (channels) {
                for (const channelId of channels.keys()) {
                    this.channelToLab.delete(channelId);
                }
            }

            // Remove all lab data
            this.labs.delete(labId);
            this.channels.delete(labId);
            this.roles.delete(labId);
            this.members.delete(labId);
            this.invites.delete(labId);
            this.tags.delete(labId);
            this.requests.delete(labId);
            this.messages.delete(labId);
            this.permissions.delete(labId);
        },
        /** Add a channel to a lab. */
        addChannel(labId: LabId, channel: Channel) {
            if (DEV) {
                console.debug('[labs] addChannel', labId, channel);
            }

            const channels = this.channels.get(labId);
            if (!channels) {
                return;
            }

            channels.set(channel.id, channel);
            this.channelToLab.set(channel.id, labId);

            // Initialize empty messages map for this channel
            let messages = this.messages.get(labId);
            if (!messages) {
                messages = new Map();
                this.messages.set(labId, messages);
            }
            if (!messages.has(channel.id)) {
                messages.set(channel.id, []);
            }
        },
        /** Update an existing channel. */
        updateChannel(labId: LabId, channel: Channel) {
            if (DEV) {
                console.debug('[labs] updateChannel', labId, channel);
            }

            const channels = this.channels.get(labId);
            if (!channels || !channels.has(channel.id)) {
                return;
            }

            channels.set(channel.id, channel);
        },
        /** Remove a channel from a lab. */
        removeChannel(labId: LabId, channelId: ChannelId) {
            if (DEV) {
                console.debug('[labs] removeChannel', labId, channelId);
            }

            const channels = this.channels.get(labId);
            if (channels) {
                channels.delete(channelId);
            }

            this.channelToLab.delete(channelId);

            // Remove messages for this channel
            const messages = this.messages.get(labId);
            if (messages) {
                messages.delete(channelId);
            }
        },
        /** Prepend a new request to the lab list. */
        addRequest(labId: LabId, entry: PrintRequestEvent) {
            if (DEV) {
                console.debug('[labs] addRequest', labId, entry);
            }

            if (entry.user) {
                this.users.set(entry.user.id, entry.user);
            }
            const requests = this.requests.get(labId);
            if (requests) {
                requests.unshift(entry);
            }
        },
        /** Update an existing request entry. */
        updateRequest(labId: LabId, entry: PrintRequestEvent) {
            if (DEV) {
                console.debug('[labs] updateRequest', labId, entry);
            }

            if (entry.user) {
                this.users.set(entry.user.id, entry.user);
            }
            const requests = this.requests.get(labId);
            if (!requests) {
                return;
            }

            const idx = requests.findIndex((r) => r.request.id === entry.request.id);
            if (idx !== -1) {
                requests[idx] = entry;
            }
        },
        /** Remove a request by id. */
        removeRequest(labId: LabId, requestId: RequestId) {
            if (DEV) {
                console.debug('[labs] removeRequest', labId, requestId);
            }

            const requests = this.requests.get(labId);
            if (requests) {
                const filtered = requests.filter((r) => r.request.id !== requestId);
                this.requests.set(labId, filtered);
            }
        },
        /** Add a tag to the lab. */
        addTag(labId: LabId, tag: RequestTag) {
            if (DEV) {
                console.debug('[labs] addTag', labId, tag);
            }

            const tags = this.tags.get(labId);
            if (tags) {
                tags.set(tag.id, tag);
            }
        },
        /** Update an existing tag. */
        updateTag(labId: LabId, tag: RequestTag) {
            if (DEV) {
                console.debug('[labs] updateTag', labId, tag);
            }

            const tags = this.tags.get(labId);
            if (tags && tags.has(tag.id)) {
                tags.set(tag.id, tag);
            }
        },
        /** Remove tag from lab and all requests. */
        removeTag(labId: LabId, tagId: TagId) {
            if (DEV) {
                console.debug('[labs] removeTag', labId, tagId);
            }

            const tags = this.tags.get(labId);
            if (tags) {
                tags.delete(tagId);
            }

            // Remove tag from all requests in this lab
            const requests = this.requests.get(labId);
            if (requests) {
                for (const req of requests) {
                    req.tags = req.tags.filter((t) => t.id !== tagId);
                }
            }
        },
        /** Add a member to the lab. */
        addMember(labId: LabId, event: MemberEvent) {
            if (DEV) {
                console.debug('[labs] addMember', labId, event);
            }

            if (event.user) {
                this.users.set(event.user.id, event.user);
            }
            const members = this.members.get(labId);
            if (members) {
                members.set(event.member.user_id, event.member);
            }
        },
        /** Remove member by user id. */
        removeMember(labId: LabId, userId: UserId) {
            if (DEV) {
                console.debug('[labs] removeMember', labId, userId);
            }

            const members = this.members.get(labId);
            if (members) {
                members.delete(userId);
            }
        },
        /** Handle member leave events. */
        handleMemberLeft(labId: LabId, userId: UserId) {
            const auth = useAuthStore();
            this.removeMember(labId, userId);
            if (auth.user?.id === userId) {
                if (DEV) {
                    console.debug('[labs] removeLab', labId);
                }
                this.removeLab(labId);
            }
        },
        /** Add an invite to the lab. */
        addInvite(labId: LabId, invite: LabInvite) {
            if (DEV) {
                console.debug('[labs] addInvite', labId, invite);
            }

            const invites = this.invites.get(labId);
            if (invites) {
                invites.set(invite.id, invite);
            }
        },
        /** Update invite fields. */
        updateInvite(labId: LabId, invite: LabInvite) {
            if (DEV) {
                console.debug('[labs] updateInvite', labId, invite);
            }

            const invites = this.invites.get(labId);
            if (invites && invites.has(invite.id)) {
                invites.set(invite.id, invite);
            }
        },
        /** Remove invite by id. */
        removeInvite(labId: LabId, inviteId: InviteId) {
            if (DEV) {
                console.debug('[labs] removeInvite', labId, inviteId);
            }

            const invites = this.invites.get(labId);
            if (invites) {
                invites.delete(inviteId);
            }
        },
        /** Add a role to the lab. */
        addRole(labId: LabId, role: LabRole) {
            if (DEV) {
                console.debug('[labs] addRole', labId, role);
            }

            const roles = this.roles.get(labId);
            if (roles) {
                roles.set(role.id, role);
            }
        },
        /** Update role fields. */
        updateRole(labId: LabId, role: LabRole) {
            if (DEV) {
                console.debug('[labs] updateRole', labId, role);
            }

            const roles = this.roles.get(labId);
            if (roles && roles.has(role.id)) {
                roles.set(role.id, role);
            }
        },
        /** Remove a role from the lab. */
        removeRole(labId: LabId, roleId: RoleId) {
            if (DEV) {
                console.debug('[labs] removeRole', labId, roleId);
            }

            const roles = this.roles.get(labId);
            if (roles) {
                roles.delete(roleId);
            }
        },
        /**
         * Add a user's public profile information
         */
        addUser(user: User) {
            if (DEV) {
                console.debug('[labs] addUser', user);
            }

            this.users.set(user.id, user);
        },
        /** Cache or update a user's public profile information. */
        updateUser(user: User) {
            if (DEV) {
                console.debug('[labs] updateUser', user);
            }

            this.users.set(user.id, user);
        },
        /** Set initial messages for a channel. */
        setMessages(channelId: ChannelId, msgs: Message[]) {
            const labId = this.channelToLab.get(channelId);
            if (!labId) {
                return;
            }

            if (DEV) {
                console.debug('[labs] setMessages', channelId, msgs);
            }

            let messages = this.messages.get(labId);
            if (!messages) {
                messages = new Map();
                this.messages.set(labId, messages);
            }
            messages.set(channelId, msgs);
        },
        /** Append a new message to a channel. */
        addMessage(channelId: ChannelId, msg: Message) {
            const labId = this.channelToLab.get(channelId);
            if (!labId) {
                return;
            }

            let messages = this.messages.get(labId);
            if (!messages) {
                messages = new Map();
                this.messages.set(labId, messages);
            }

            let channelMessages = messages.get(channelId);
            if (!channelMessages) {
                channelMessages = [];
                messages.set(channelId, channelMessages);
            }

            if (DEV) {
                console.debug('[labs] addMessage', channelId, msg);
            }
            channelMessages.push(msg);
        },
        /** Update message content. */
        updateMessage(channelId: ChannelId, msg: Message) {
            const labId = this.channelToLab.get(channelId);
            if (!labId) {
                return;
            }

            const messages = this.messages.get(labId);
            const channelMessages = messages?.get(channelId);
            if (!channelMessages) {
                return;
            }

            const idx = channelMessages.findIndex((m) => m.id === msg.id);
            if (idx !== -1) {
                if (DEV) {
                    console.debug('[labs] updateMessage', channelId, msg);
                }
                channelMessages[idx] = msg;
            }
        },
        /** Remove a message from a channel. */
        removeMessage(channelId: ChannelId, messageId: MessageId) {
            const labId = this.channelToLab.get(channelId);
            if (!labId) {
                return;
            }

            const messages = this.messages.get(labId);
            const channelMessages = messages?.get(channelId);
            if (!channelMessages) {
                return;
            }

            if (DEV) {
                console.debug('[labs] removeMessage', channelId, messageId);
            }

            const filtered = channelMessages.filter((m) => m.id !== messageId);
            messages!.set(channelId, filtered);
        },
        /** Check if messages have been loaded for a channel. */
        hasMessages(channelId: ChannelId) {
            const labId = this.channelToLab.get(channelId);
            if (!labId) {
                return false;
            }

            const messages = this.messages.get(labId);
            return Array.isArray(messages?.get(channelId));
        },
        /** Retrieve messages for a channel. */
        getMessages(channelId: ChannelId): Message[] {
            const labId = this.channelToLab.get(channelId);
            if (!labId) {
                return [];
            }

            const messages = this.messages.get(labId);
            return messages?.get(channelId) ?? [];
        },
    },
});
