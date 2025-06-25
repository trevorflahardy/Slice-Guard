import { OpCode, type OpCodePayloadUnion, type OpCodeValue } from '@shared/ws/opcodes';
import * as auth from "../handlers/auth";
import * as requestHandlers from "../handlers/request";
import * as labHandlers from "../handlers/lab";
import type State from '../../utils/state';
import type { Logger } from 'pino';
import type { ServerWebSocket } from '..';
import { ErrorCode } from '@slice-guard/shared/ws/errors';
import { verifyJwt } from '../../utils/jwt';


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

export interface AuthenticatedPayload<D> extends HandlerPayload<D> {
  userId: number;
}

export function withAuth<D>(handler: (payload: AuthenticatedPayload<D>) => Promise<HandlerResponse>): Handler<D & { d: { token: string } }> {
  return async (payload: HandlerPayload<D & { d: { token: string } }>): Promise<HandlerResponse> => {
    let userId: number;
    try {
      const decoded = verifyJwt(payload.data.d.token) as any;
      userId = (decoded as any).id;
    } catch {
      return ErrorCode.UNAUTHORIZED;
    }
    return handler(Object.assign(payload, { userId }));
  };
}

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
  | OpCode.AUTH_LOGOUT
  | OpCode.REQUEST_CREATE
  | OpCode.REQUEST_LIST
  | OpCode.TAG_CREATE
  | OpCode.TAG_SET_DEFAULT
  | OpCode.REQUEST_ASSIGN_TAG
  | OpCode.LAB_CREATE
  | OpCode.LAB_UPDATE
  | OpCode.LAB_DELETE
  | OpCode.ROLE_CREATE
  | OpCode.MEMBER_ADD
  | OpCode.MEMBER_REMOVE;

export const handlers: HandlerMap<HandlerMapItems> = {
  ...auth.handlers,
  ...requestHandlers.handlers,
  ...labHandlers.handlers,
}
