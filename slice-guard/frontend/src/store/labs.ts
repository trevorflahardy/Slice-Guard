import { defineStore } from 'pinia'
import type { RequestTag } from '@shared/db/request'
import type { LabState, PrintRequestEvent, MemberEvent } from '@shared/payloads/ws'
import type { LabInvite, LabRole, Lab } from '@shared/db/lab'
import type { Channel } from '@shared/db/channel'
import type { User } from '@shared/db/user'
import type { Message } from '@shared/db/message'
import { useAuthStore } from './auth'

const DEV = import.meta.env.DEV

/**
 * Central store holding all lab related state. The server sends the initial
 * state on WebSocket connection and all subsequent updates patch this store.
 */
export const useLabsStore = defineStore('labs', {
  state: () => ({
    labs: [] as LabState[],
  }),
  actions: {
    /** Replace current state with initial labs. */
    setInitial(labs: LabState[]) {
      if (DEV) console.debug('[labs] setInitial', labs)
      this.labs = labs
    },
    /** Get a lab by id. */
    getLab(id: number) {
      return this.labs.find(l => l.lab.id === id) || null
    },
    /** Find a channel by id across all labs. */
    getChannel(id: number): Channel | null {
      for (const l of this.labs) {
        const ch = l.channels.find(c => c.id === id)
        if (ch) return ch
      }
      return null
    },
    /** Add a new lab to the store. */
    addLab(lab: LabState) {
      if (DEV) console.debug('[labs] addLab', lab)
      this.labs.push(lab)
    },
    /** Update basic lab info. */
    updateLab(lab: Lab) {
      const entry = this.getLab(lab.id)
      if (!entry) return
      if (DEV) console.debug('[labs] updateLab', lab)
      entry.lab = lab
    },
    /** Remove a lab entirely. */
    removeLab(labId: number) {
      if (DEV) console.debug('[labs] removeLab', labId)
      this.labs = this.labs.filter(l => l.lab.id !== labId)
    },
    /** Add a channel to a lab. */
    addChannel(labId: number, channel: Channel) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] addChannel', labId, channel)
      lab.channels.push(channel)
    },
    /** Update an existing channel. */
    updateChannel(labId: number, channel: Channel) {
      const lab = this.getLab(labId)
      if (!lab) return
      const idx = lab.channels.findIndex(c => c.id === channel.id)
      if (idx !== -1) {
        if (DEV) console.debug('[labs] updateChannel', labId, channel)
        lab.channels[idx] = channel
      }
    },
    /** Remove a channel from a lab. */
    removeChannel(labId: number, channelId: number) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] removeChannel', labId, channelId)
      lab.channels = lab.channels.filter(c => c.id !== channelId)
      delete lab.messages[channelId]
    },
    /** Prepend a new request to the lab list. */
    addRequest(labId: number, entry: PrintRequestEvent) {
      const lab = this.getLab(labId)
      if (DEV) console.debug('[labs] addRequest', labId, entry)
      lab?.requests.unshift(entry)
    },
    /** Update an existing request entry. */
    updateRequest(labId: number, entry: PrintRequestEvent) {
      const lab = this.getLab(labId)
      if (!lab) return
      const idx = lab.requests.findIndex(r => r.request.id === entry.request.id)
      if (idx !== -1) {
        if (DEV) console.debug('[labs] updateRequest', labId, entry)
        lab.requests[idx] = entry
      }
    },
    /** Remove a request by id. */
    removeRequest(labId: number, requestId: number) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] removeRequest', labId, requestId)
      lab.requests = lab.requests.filter(r => r.request.id !== requestId)
    },
    /** Add a tag to the lab. */
    addTag(labId: number, tag: RequestTag) {
      const lab = this.getLab(labId)
      if (DEV) console.debug('[labs] addTag', labId, tag)
      lab?.tags.push(tag)
    },
    /** Update an existing tag. */
    updateTag(labId: number, tag: RequestTag) {
      const lab = this.getLab(labId)
      if (!lab) return
      const idx = lab.tags.findIndex(t => t.id === tag.id)
      if (idx !== -1) {
        if (DEV) console.debug('[labs] updateTag', labId, tag)
        lab.tags[idx] = tag
      }
    },
    /** Remove tag from lab and all requests. */
    removeTag(labId: number, tagId: number) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] removeTag', labId, tagId)
      lab.tags = lab.tags.filter(t => t.id !== tagId)
      for (const req of lab.requests) {
        req.tags = req.tags.filter(t => t.id !== tagId)
      }
    },
    /** Add a member to the lab. */
    addMember(labId: number, event: MemberEvent) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] addMember', labId, event)
      lab.members.push(event)
    },
    /** Remove member by user id. */
    removeMember(labId: number, userId: number) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] removeMember', labId, userId)
      lab.members = lab.members.filter(m => m.member.user_id !== userId)
    },
    /** Handle member leave events. */
    handleMemberLeft(labId: number, userId: number) {
      const auth = useAuthStore()
      this.removeMember(labId, userId)
      if (auth.user?.id === userId) {
        if (DEV) console.debug('[labs] removeLab', labId)
        this.labs = this.labs.filter(l => l.lab.id !== labId)
      }
    },
    /** Add an invite to the lab. */
    addInvite(labId: number, invite: LabInvite) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] addInvite', labId, invite)
      lab.invites.push(invite)
    },
    /** Update invite fields. */
    updateInvite(labId: number, invite: LabInvite) {
      const lab = this.getLab(labId)
      if (!lab) return
      const idx = lab.invites.findIndex(i => i.id === invite.id)
      if (idx !== -1) {
        if (DEV) console.debug('[labs] updateInvite', labId, invite)
        lab.invites[idx] = invite
      }
    },
    /** Remove invite by id. */
    removeInvite(labId: number, inviteId: number) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] removeInvite', labId, inviteId)
      lab.invites = lab.invites.filter(i => i.id !== inviteId)
    },
    /** Add a role to the lab. */
    addRole(labId: number, role: LabRole) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] addRole', labId, role)
      lab.roles.push(role)
    },
    /** Update role fields. */
    updateRole(labId: number, role: LabRole) {
      const lab = this.getLab(labId)
      if (!lab) return
      const idx = lab.roles.findIndex(r => r.id === role.id)
      if (idx !== -1) {
        if (DEV) console.debug('[labs] updateRole', labId, role)
        lab.roles[idx] = role
      }
    },
    /** Remove a role from the lab. */
    removeRole(labId: number, roleId: number) {
      const lab = this.getLab(labId)
      if (!lab) return
      if (DEV) console.debug('[labs] removeRole', labId, roleId)
      lab.roles = lab.roles.filter(r => r.id !== roleId)
    },
    /** Update user info across members and requests. */
    updateUser(user: User) {
      if (DEV) console.debug('[labs] updateUser', user)
      for (const lab of this.labs) {
        for (const m of lab.members) {
          if (m.user?.id === user.id) m.user = user
        }
        for (const r of lab.requests) {
          if (r.user?.id === user.id) r.user = user
        }
      }
    },
    /** Set initial messages for a channel. */
    setMessages(channelId: number, msgs: Message[]) {
      const lab = this.labs.find(l => l.channels.some(c => c.id === channelId))
      if (!lab) return
      if (DEV) console.debug('[labs] setMessages', channelId, msgs)
      lab.messages[channelId] = msgs
    },
    /** Append a new message to a channel. */
    addMessage(channelId: number, msg: Message) {
      const lab = this.labs.find(l => l.channels.some(c => c.id === channelId))
      if (!lab) return
      if (!lab.messages[channelId]) lab.messages[channelId] = []
      if (DEV) console.debug('[labs] addMessage', channelId, msg)
      lab.messages[channelId].push(msg)
    },
    /** Update message content. */
    updateMessage(channelId: number, msg: Message) {
      const lab = this.labs.find(l => l.channels.some(c => c.id === channelId))
      if (!lab || !lab.messages[channelId]) return
      const idx = lab.messages[channelId].findIndex(m => m.id === msg.id)
      if (idx !== -1) {
        if (DEV) console.debug('[labs] updateMessage', channelId, msg)
        lab.messages[channelId][idx] = msg
      }
    },
    /** Remove a message from a channel. */
    removeMessage(channelId: number, messageId: number) {
      const lab = this.labs.find(l => l.channels.some(c => c.id === channelId))
      if (!lab || !lab.messages[channelId]) return
      if (DEV) console.debug('[labs] removeMessage', channelId, messageId)
      lab.messages[channelId] = lab.messages[channelId].filter(m => m.id !== messageId)
    },
    /** Check if messages have been loaded for a channel. */
    hasMessages(channelId: number) {
      const lab = this.labs.find(l => l.channels.some(c => c.id === channelId))
      if (!lab) return false
      return Array.isArray(lab.messages[channelId])
    },
    /** Retrieve messages for a channel. */
    getMessages(channelId: number): Message[] {
      const lab = this.labs.find(l => l.channels.some(c => c.id === channelId))
      return lab?.messages[channelId] ?? []
    },
  },
})
