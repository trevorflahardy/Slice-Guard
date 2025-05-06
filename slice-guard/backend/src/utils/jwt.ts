/**
 * @fileoverview JWT utility functions for signing and verifying tokens.
 */
import jwt from "jsonwebtoken";

// ! Set during build time. Must be set.
const JWT_SECRET = process.env.JWT_SECRET!;

export function signJwt(payload: object, expiresIn = "15m") {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string) {
    return jwt.verify(token, JWT_SECRET);
}