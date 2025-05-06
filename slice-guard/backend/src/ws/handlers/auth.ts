/**
 * @fileoverview Manages WebSocket authentication and authorization logic.
 * Defines handlers for login, register, refresh, and logout operations.
 */

import { OpCode, type AuthLoginPayload, type AuthLogoutPayload, type AuthRefreshPayload } from "@shared/ws/opcodes"
import type { HandlerMap } from ".."

export const handlers: HandlerMap = {
    [OpCode.AUTH_LOGIN]: handleAuthLogin,
    [OpCode.AUTH_REGISTER]: handleAuthRegister,
    [OpCode.AUTH_REFRESH]: handleAuthRefresh,
    [OpCode.AUTH_LOGOUT]: handleAuthLogout,
};

async function handleAuthLogin(ws: Bun.WebSocket, payload: AuthLoginPayload): Promise<void> {
    const { email, password } = payload.d;
}

async function handleAuthRegister(ws: Bun.WebSocket, payload: AuthLoginPayload): Promise<void> {
    const { email, password, name } = payload.d;
}

async function handleAuthRefresh(ws: Bun.WebSocket, payload: AuthRefreshPayload): Promise<void> {
    const { refreshToken } = payload.d;
}

async function handleAuthLogout(ws: Bun.WebSocket, payload: AuthLogoutPayload): Promise<void> {
    const { refreshToken } = payload.d;
}