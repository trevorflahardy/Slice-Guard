import { defineStore } from 'pinia'
import type { RequestTag } from '@shared/db/request'
import type { LabState, PrintRequestEvent, MemberEvent } from '@shared/payloads/ws'
import type { LabInvite } from '@shared/db/lab'
import type { User } from '@shared/db/user'

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
    /** Add a new lab to the store. */
    addLab(lab: LabState) {
      if (DEV) console.debug('[labs] addLab', lab)
      this.labs.push(lab)
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
  },
})
