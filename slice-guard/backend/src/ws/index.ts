import { OpCode, type OpCodePayload, type OpCodePayloadUnion, type OpCodeValue } from '@shared/ws/opcodes';
import type State from '../utils/state';
import type { Server } from '../server';
import { handlers, HandlerPayload, type Handler, type HandlerResponse } from "./handlers";
import { ErrorCode, toErrorCodeValue, type ErrorCodeValue } from '@slice-guard/shared/ws/errors';
import { type ErrorPayload } from '@shared/ws/opcodes';


export type WebSocketData = {
    created_at: number;
    id: string;
}

export type ServerWebSocket = Bun.ServerWebSocket<WebSocketData>;

export async function validateAndDispatchMessage(server: Server, ws: ServerWebSocket, message: string | Buffer<ArrayBufferLike>, state: State): Promise<null> {
    // Try and narrow this type of data, assuming it follows the convention
    // of OpCodePayload.
    // One of a couple things will be passed here. Either an object, string,
    // or buffer of data.
    // ! TODO: Better impl of narrowing this type and decoding passed

    let payloadData: OpCodePayloadUnion;
    try {
        payloadData = JSON.parse(message.toString());
    }
    catch (_e) {
        // Assume nothing cna be done here, for now.
        // ! TODO: Update this to be far better
        server.logger.error("Failed to parse message", message);
        return;
    }

    // Check if the payloadData is a valid OpCode
    let handler: Handler<OpCodePayloadUnion> = handlers[payloadData.op];
    if (!handler) {
        // We have received something invalid from the client.
        // For now, complain about it and simply do nothing.
        // ! TODO: In the future, upgrade this to send a message back to the client.
        server.logger.error("Invalid OpCode received:", payloadData.op);
        return;
    }

    // Validate that *some* data has been passed to us
    if (!payloadData.d) {
        // ! TODO: In the future, upgrade this to send a message back to the client.
        server.logger.error("No data passed to OpCode:", payloadData.op);
        return;
    }

    // This.. should be valid. We can create a payload object from this.
    const loggerChild = server.logger.child({
        op: payloadData.op,
        ws_id: ws.data.id,
        ws_created_at: ws.data.created_at,
    })
    const payload: HandlerPayload<OpCodePayloadUnion> = new HandlerPayload<OpCodePayloadUnion>(ws, payloadData, state, loggerChild);

    // Pass logic off to the handler, which will handle the payload
    let response: HandlerResponse | ErrorPayload<ErrorCode> = await handler(payload);

    // IF this response is the enum ErrorCode, it has error'd out somehow.
    if (Object.values(ErrorCode).includes(response as ErrorCode)) {
        // Wrap this in an error response here
        response = {
            op: OpCode.ERROR,
            d: {
                code: response as ErrorCode,
                message: toErrorCodeValue(response as ErrorCodeValue)
            }
        }
    }

    // We can send this back to the socket
    ws.send(JSON.stringify(response));
    return null;
}