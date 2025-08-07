import { withAuth } from './middleware'
import { getMemberRolePermissions } from '../db/lab'
import { hasLabPermission } from '../utils/permissions'
import { LabPermission } from '@shared/db/lab'
import {
  createChannel,
  listChannels,
  updateChannel,
  deleteChannel,
  setChannelPosition,
  getChannel,
} from '../db/lab/channel'
import {
  createMessage,
  updateMessage,
  deleteMessage,
  getMessage,
  listMessages,
} from '../db/lab/message'
import type {
  ChannelCreatePayload,
  ChannelUpdatePayload,
  ChannelPositionPayload,
  MessageCreatePayload,
  MessageUpdatePayload,
} from '@shared/payloads'
import { WsEvent } from '@shared/payloads/ws'

/**
 * GET /api/labs/:labId/channels
 * List all channels for a lab.
 */
export const listChannelsRoute = withAuth(async (_req, userId, state, params) => {
  const labId = Number(params.labId)
  const perms = await getMemberRolePermissions(state.db, labId, userId)
  if (!hasLabPermission(perms, LabPermission.READ)) return new Response('Unauthorized', { status: 403 })
  const channels = await listChannels(state.db, labId)
  return Response.json(channels)
})

/**
 * POST /api/labs/:labId/channels
 * Create a new channel within a lab.
 */
export const createChannelRoute = withAuth(async (req, userId, state, params) => {
  const labId = Number(params.labId)
  const perms = await getMemberRolePermissions(state.db, labId, userId)
  if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES)) return new Response('Unauthorized', { status: 403 })
  const { type, name, position, categoryId, description, requestId } = await req.json() as ChannelCreatePayload
  const channel = await createChannel(state.db, type, name, position, labId, categoryId ?? null, description ?? null, requestId ?? null)
  state.broadcast({ op: WsEvent.CHANNEL_CREATED, d: { channel } })
  return Response.json({ channel })
})

/**
 * PATCH /api/labs/:labId/channels/:channelId
 * Update channel fields.
 */
export const updateChannelRoute = withAuth(async (req, userId, state, params) => {
  const labId = Number(params.labId)
  const channelId = Number(params.channelId)
  const perms = await getMemberRolePermissions(state.db, labId, userId)
  if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES)) return new Response('Unauthorized', { status: 403 })
  const { name, description, categoryId } = await req.json() as ChannelUpdatePayload
  const channel = await updateChannel(state.db, channelId, name, description ?? null, categoryId ?? null)
  state.broadcast({ op: WsEvent.CHANNEL_UPDATED, d: { channel } })
  return Response.json({ channel })
})

/**
 * PATCH /api/labs/:labId/channels/:channelId/position
 * Reorder a channel.
 */
export const setChannelPositionRoute = withAuth(async (req, userId, state, params) => {
  const labId = Number(params.labId)
  const channelId = Number(params.channelId)
  const perms = await getMemberRolePermissions(state.db, labId, userId)
  if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES)) return new Response('Unauthorized', { status: 403 })
  const { position } = await req.json() as ChannelPositionPayload
  const channel = await setChannelPosition(state.db, channelId, position)
  state.broadcast({ op: WsEvent.CHANNEL_UPDATED, d: { channel } })
  return Response.json({ channel })
})

/**
 * DELETE /api/labs/:labId/channels/:channelId
 */
export const deleteChannelRoute = withAuth(async (_req, userId, state, params) => {
  const labId = Number(params.labId)
  const channelId = Number(params.channelId)
  const perms = await getMemberRolePermissions(state.db, labId, userId)
  if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES)) return new Response('Unauthorized', { status: 403 })
  await deleteChannel(state.db, channelId)
  state.broadcast({ op: WsEvent.CHANNEL_DELETED, d: { channelId, labId } })
  return new Response(null, { status: 204 })
})

/**
 * GET /api/channels/:channelId/messages
 * Fetch messages with optional pagination.
 */
export const listMessagesRoute = withAuth(async (req, userId, state, params) => {
  const channelId = Number(params.channelId)
  const channel = await getChannel(state.db, channelId)
  if (!channel) return new Response('Not found', { status: 404 })
  if (channel.lab_id) {
    const perms = await getMemberRolePermissions(state.db, channel.lab_id, userId)
    if (!hasLabPermission(perms, LabPermission.READ)) return new Response('Unauthorized', { status: 403 })
  }
  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit') ?? 50)
  const before = url.searchParams.get('before')
  const messages = await listMessages(state.db, channelId, limit, before ? Number(before) : undefined)
  return Response.json(messages)
})

/**
 * POST /api/channels/:channelId/messages
 * Create a new message in a channel.
 */
export const createMessageRoute = withAuth(async (req, userId, state, params) => {
  const channelId = Number(params.channelId)
  const channel = await getChannel(state.db, channelId)
  if (!channel) return new Response('Not found', { status: 404 })
  if (channel.lab_id) {
    const perms = await getMemberRolePermissions(state.db, channel.lab_id, userId)
    if (!hasLabPermission(perms, LabPermission.WRITE)) return new Response('Unauthorized', { status: 403 })
  }
  const { content, userMentions, roleMentions } = await req.json() as MessageCreatePayload
  const message = await createMessage(state.db, channelId, userId, content, userMentions ?? [], roleMentions ?? [])
  state.broadcast({ op: WsEvent.MESSAGE_CREATED, d: { message } })
  return Response.json({ message })
})

/**
 * PATCH /api/channels/:channelId/messages/:messageId
 * Update an existing message.
 */
export const updateMessageRoute = withAuth(async (req, userId, state, params) => {
  const channelId = Number(params.channelId)
  const messageId = Number(params.messageId)
  const channel = await getChannel(state.db, channelId)
  if (!channel) return new Response('Not found', { status: 404 })
  const msg = await getMessage(state.db, messageId)
  if (!msg || msg.channel_id !== channelId) return new Response('Not found', { status: 404 })
  if (msg.user_id !== userId) {
    if (channel.lab_id) {
      const perms = await getMemberRolePermissions(state.db, channel.lab_id, userId)
      if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES)) return new Response('Unauthorized', { status: 403 })
    } else return new Response('Unauthorized', { status: 403 })
  }
  const { content, userMentions, roleMentions } = await req.json() as MessageUpdatePayload
  const message = await updateMessage(state.db, messageId, content, userMentions ?? [], roleMentions ?? [])
  state.broadcast({ op: WsEvent.MESSAGE_UPDATED, d: { message } })
  return Response.json({ message })
})

/**
 * DELETE /api/channels/:channelId/messages/:messageId
 */
export const deleteMessageRoute = withAuth(async (_req, userId, state, params) => {
  const channelId = Number(params.channelId)
  const messageId = Number(params.messageId)
  const channel = await getChannel(state.db, channelId)
  if (!channel) return new Response('Not found', { status: 404 })
  const msg = await getMessage(state.db, messageId)
  if (!msg || msg.channel_id !== channelId) return new Response('Not found', { status: 404 })
  if (msg.user_id !== userId) {
    if (channel.lab_id) {
      const perms = await getMemberRolePermissions(state.db, channel.lab_id, userId)
      if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES)) return new Response('Unauthorized', { status: 403 })
    } else return new Response('Unauthorized', { status: 403 })
  }
  await deleteMessage(state.db, messageId)
  state.broadcast({ op: WsEvent.MESSAGE_DELETED, d: { channelId, messageId } })
  return new Response(null, { status: 204 })
})
