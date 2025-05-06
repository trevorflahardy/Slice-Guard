import { OpCode, type OpCodePayloadMap, type OpCodeValue } from '../../../shared/ws/opcodes';
import * as auth from "./handlers/auth";

export type Handler<K extends OpCodeValue> = (ws: Bun.WebSocket, payload: OpCodePayloadMap[K]) => Promise<void> | void;

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