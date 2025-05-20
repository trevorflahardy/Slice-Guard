import { OpCode, type OpCodePayload, type OpCodePayloadMap, type OpCodePayloadUnion, type OpCodeValue } from '@shared/ws/opcodes';
import * as auth from "../handlers/auth";
import type State from '../../utils/state';
import type { Logger } from 'pino';
import type { ServerWebSocket } from '..';
import type { ErrorCode } from '@slice-guard/shared/ws/errors';


export class HandlerPayload<D> {
    public ws: ServerWebSocket;
    public data: D;
    public state: State;
    public logger: Logger;

    constructor(ws: ServerWebSocket, data: D, state: State, logger: Logger) {
        this.ws = ws;
        this.data = data;
        this.state = state;
        this.logger = logger;
    }
}

export type HandlerResponse = ErrorCode | OpCodePayloadUnion;

export type Handler<D> = (payload: HandlerPayload<D>) => Promise<HandlerResponse>;

/**
 * Mapping of OpCode to handler function. Generic by default, so modules exporting this do not need to specify exactly
 * the OpCodes they cover.
 *
 * See below, where all OpCodes are specified in the HandlerMapItems type as a requirement for type safety.
 */
export type HandlerMap<K extends OpCodeValue = OpCodeValue> = Partial<{
    [P in K]: Handler<any>;
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
