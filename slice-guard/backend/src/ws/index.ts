import { OpCode, type OpCodePayloadMap, type OpCodePayloadUnion, type OpCodeValue } from '@shared/ws/opcodes';
import * as auth from "./handlers/auth";
import type State from '../utils/state';

export type Handler<K extends OpCodeValue> = (ws: Bun.WebSocket, payload: OpCodePayloadMap[K], state: State) => Promise<void> | void;

/**
 * Mapping of OpCode to handler function. Generic by default, so modules exporting this do not need to specify exactly
 * the OpCodes they cover.
 *
 * See below, where all OpCodes are specified in the HandlerMapItems type as a requirement for type safety.
 */
export type HandlerMap<K extends OpCodeValue = OpCodeValue> = Partial<{
    [P in K]: Handler<P>;
}>;

/**
 * Constraints on the handler map - not all OpCodes are handled, IE some are responses and do not need handlers.
 *
 * This is a union of all OpCodes that are handled by the server from the client as a request for some operation.
 */
type HandlerMapItems = OpCode.AUTH_LOGIN
    | OpCode.AUTH_REGISTER
    | OpCode.AUTH_REFRESH
    | OpCode.AUTH_LOGOUT;

export const handlers: HandlerMap<HandlerMapItems> = {
    ...auth.handlers,
}

export async function validateAndDispatchMessage(ws, message: string | object | Buffer<ArrayBufferLike>, state: State): Promise<null> {
    // Try and narrow this type of data, assuming it follows the convention
    // of OpCodePayload.
    // One of a couple things will be passed here. Either an object, string,
    // or buffer of data.
    // ! TODO: Better impl of narrowing this type and decoding passed

    let payload: OpCodePayloadUnion;
    try {
        payload = JSON.parse(message.toString());
    }
    catch (_e) {
        // Assume nothing cna be done here, for now.
        // ! TODO: Update this to be far better
        console.error("Failed to parse message", message);
        return;
    }

    // Check if the payload is a valid OpCode
    let handler = handlers[payload.op];
    if (!handler) {
        // We have received something invalid from the client.
        // For now, complain about it and simply do nothing.
        // ! TODO: In the future, upgrade this to send a message back to the client.
        console.error("Invalid OpCode received:", payload.op);
        return;
    }

    // Validate that *some* data has been passed to us
    if (!payload.d) {
        // ! TODO: In the future, upgrade this to send a message back to the client.
        console.error("No data passed to OpCode:", payload.op);
        return;
    }

    // Pass logic off to the handler, which will handle the payload
    await handler(ws, payload);
}