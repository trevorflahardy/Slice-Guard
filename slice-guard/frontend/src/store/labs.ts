import { defineStore } from 'pinia'
import type { RequestTag } from '@shared/db/request'
import type { LabState, PrintRequestEvent, MemberEvent } from '@shared/payloads/ws'

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
      this.labs = labs
    },
    /** Get a lab by id. */
    getLab(id: number) {
      return this.labs.find(l => l.lab.id === id) || null
    },
    /** Prepend a new request to the lab list. */
    addRequest(labId: number, entry: PrintRequestEvent) {
      const lab = this.getLab(labId)
      lab?.requests.unshift(entry)
    },
    /** Update an existing request entry. */
    updateRequest(labId: number, entry: PrintRequestEvent) {
      const lab = this.getLab(labId)
      if (!lab) return
      const idx = lab.requests.findIndex(r => r.request.id === entry.request.id)
      if (idx !== -1) lab.requests[idx] = entry
    },
    /** Remove a request by id. */
    removeRequest(labId: number, requestId: number) {
      const lab = this.getLab(labId)
      if (!lab) return
      lab.requests = lab.requests.filter(r => r.request.id !== requestId)
    },
    /** Add a tag to the lab. */
    addTag(labId: number, tag: RequestTag) {
      const lab = this.getLab(labId)
      lab?.tags.push(tag)
    },
    /** Update an existing tag. */
    updateTag(labId: number, tag: RequestTag) {
      const lab = this.getLab(labId)
      if (!lab) return
      const idx = lab.tags.findIndex(t => t.id === tag.id)
      if (idx !== -1) lab.tags[idx] = tag
    },
    /** Remove tag from lab and all requests. */
    removeTag(labId: number, tagId: number) {
      const lab = this.getLab(labId)
      if (!lab) return
      lab.tags = lab.tags.filter(t => t.id !== tagId)
      for (const req of lab.requests) {
        req.tags = req.tags.filter(t => t.id !== tagId)
      }
    },
    /** Add a member to the lab. */
    addMember(labId: number, event: MemberEvent) {
      const lab = this.getLab(labId)
      if (!lab) return
      lab.members.push(event)
    },
    /** Remove member by user id. */
    removeMember(labId: number, userId: number) {
      const lab = this.getLab(labId)
      if (!lab) return
      lab.members = lab.members.filter(m => m.member.user_id !== userId)
    },
  },
})
