/**
 * @fileoverview Manages WebSocket authentication and authorization logic.
 * Defines handlers for login, register, refresh, and logout operations.
 */

import { OpCode, type AuthLoginPayload, type AuthLogoutPayload, type AuthRefreshPayload } from "@shared/ws/opcodes"
import type { HandlerMap, HandlerPayload } from "."
import { ErrorCode } from "@slice-guard/shared/ws/errors";

export const handlers: HandlerMap = {
    [OpCode.AUTH_LOGIN]: handleAuthLogin,
    [OpCode.AUTH_REGISTER]: handleAuthRegister,
    [OpCode.AUTH_REFRESH]: handleAuthRefresh,
    [OpCode.AUTH_LOGOUT]: handleAuthLogout,
};

async function handleAuthLogin(payload: HandlerPayload<AuthLoginPayload>) {
    const { email, password } = payload.data.d;

    return ErrorCode.UNIMPLEMENTED;
}

async function handleAuthRegister(payload: HandlerPayload<AuthLoginPayload>) {
    const { email, password, name } = payload.data.d;

    // For now, debug log this attempt to register auth.
    payload.logger.debug("Registering user:", { email, password, name });

    return ErrorCode.UNIMPLEMENTED;
}

async function handleAuthRefresh(payload: HandlerPayload<AuthRefreshPayload>) {
    const { refreshToken } = payload.data.d;

    return ErrorCode.UNIMPLEMENTED;
}

async function handleAuthLogout(payload: HandlerPayload<AuthLogoutPayload>) {
    const { refreshToken } = payload.data.d;

    return ErrorCode.UNIMPLEMENTED;
}