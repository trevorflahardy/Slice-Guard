/**
 * @fileoverview Manages WebSocket authentication and authorization logic.
 * Defines handlers for login, register, refresh, and logout operations.
 */

import { OpCode, type AuthLoginPayload, type AuthLogoutPayload, type AuthRefreshPayload, type AuthSuccessPayload, type AuthFailurePayload } from "@shared/ws/opcodes"
import type { HandlerMap, HandlerPayload } from "."
import { ErrorCode } from "@slice-guard/shared/ws/errors";
import { hashPassword, verifyPassword } from "../../utils/hash";
import { signJwt } from "../../utils/jwt";
import { generateRefreshToken } from "../../utils/refresh";
import {
    createUser,
    findUserByEmail,
    findUserById,
    insertRefreshToken,
    getRefreshToken,
    deleteRefreshToken,
    deleteTokensForUser,
    type UserWithPassword
} from "../../db/user";

export const handlers: HandlerMap = {
    [OpCode.AUTH_LOGIN]: handleAuthLogin,
    [OpCode.AUTH_REGISTER]: handleAuthRegister,
    [OpCode.AUTH_REFRESH]: handleAuthRefresh,
    [OpCode.AUTH_LOGOUT]: handleAuthLogout,
};

function buildSuccess(user: UserWithPassword, access: string, refresh: string): AuthSuccessPayload {
    const { password_hash, ...publicUser } = user;
    return { op: OpCode.AUTH_SUCCESS, d: { accessToken: access, refreshToken: refresh, user: publicUser } };
}

function buildFailure(reason: string): AuthFailurePayload {
    return { op: OpCode.AUTH_FAILURE, d: { reason } };
}

async function handleAuthLogin(payload: HandlerPayload<AuthLoginPayload>) {
    const { email, password } = payload.data.d;

    const user = await findUserByEmail(payload.state.db, email);
    if (!user) {
        return buildFailure("Invalid credentials");
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
        return buildFailure("Invalid credentials");
    }

    const accessToken = signJwt({ id: user.id });
    const refreshToken = generateRefreshToken(user.id.toString());

    await insertRefreshToken(payload.state.db, user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    return buildSuccess(user, accessToken, refreshToken);
}

async function handleAuthRegister(payload: HandlerPayload<AuthLoginPayload>) {
    const { email, password, name } = payload.data.d;

    const existing = await findUserByEmail(payload.state.db, email);
    if (existing) {
        return buildFailure("Email already registered");
    }

    const hash = await hashPassword(password);
    const user = await createUser(payload.state.db, email, hash, name);

    const accessToken = signJwt({ id: user.id });
    const refreshToken = generateRefreshToken(user.id.toString());
    await insertRefreshToken(payload.state.db, user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    return buildSuccess(user, accessToken, refreshToken);
}

async function handleAuthRefresh(payload: HandlerPayload<AuthRefreshPayload>) {
    const { refreshToken } = payload.data.d;

    const tokenRow = await getRefreshToken(payload.state.db, refreshToken);
    if (!tokenRow || tokenRow.expires_at.getTime() < Date.now()) {
        return buildFailure("Invalid refresh token");
    }

    const user = await findUserById(payload.state.db, tokenRow.user_id);
    if (!user) {
        return buildFailure("Invalid refresh token");
    }

    await deleteRefreshToken(payload.state.db, refreshToken);

    const accessToken = signJwt({ id: user.id });
    const newToken = generateRefreshToken(user.id.toString());
    await insertRefreshToken(payload.state.db, user.id, newToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const response: OpCode.AUTH_REFRESH_SUCCESS = OpCode.AUTH_REFRESH_SUCCESS;
    return { op: response, d: { accessToken, refreshToken: newToken } };
}

async function handleAuthLogout(payload: HandlerPayload<AuthLogoutPayload>) {
    const { refreshToken } = payload.data.d;

    await deleteRefreshToken(payload.state.db, refreshToken);

    return { op: OpCode.AUTH_LOGOUT, d: {} };
}