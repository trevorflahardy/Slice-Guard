import { WsEvent, type WsPayloadUnion, type WsEventValue } from '@shared/payloads/ws';
import type State from '../utils/state';
import type { Server } from '../server';
import { handlers, HandlerPayload, type Handler, type HandlerResponse } from "./handlers";
import { ErrorCode, toErrorCodeValue, type ErrorCodeValue } from '@slice-guard/shared/ws/errors';
import { type WsPayload } from '@shared/payloads/ws';


export type WebSocketData = {
    created_at: number;
    id: string;
}

export type ServerWebSocket = Bun.ServerWebSocket<WebSocketData>;

export async function validateAndDispatchMessage(
    server: Server,
    ws: ServerWebSocket,
    message: string | Buffer<ArrayBufferLike>,
    state: State,
): Promise<void> {
    const raw = typeof message === "string" ? message : message.toString();
    let data: WsPayloadUnion;

    try {
        data = JSON.parse(raw);
    } catch (err) {
        server.logger.error({ err, raw }, "Failed to parse message");
        return;
    }

    if (!data || data.d == null) {
        server.logger.error({ data }, "Invalid payload received");
        return;
    }

    const handler: Handler<WsPayloadUnion> | undefined = handlers[data.op as WsEventValue];
    if (!handler) {
        server.logger.error({ op: data.op }, "Unknown event");
        return;
    }

    const loggerChild = server.logger.child({
        op: data.op,
        ws_id: ws.data.id,
        ws_created_at: ws.data.created_at,
    });

    const payload = new HandlerPayload(ws, data, state, loggerChild);

    try {
        let response: HandlerResponse | ErrorPayload<ErrorCode> = await handler(payload);

        if (Object.values(ErrorCode).includes(response as ErrorCodeValue)) {
            response = {
                op: WsEvent.ERROR,
                d: {
                    code: response as ErrorCode,
                    message: toErrorCodeValue(response as ErrorCodeValue),
                },
            };
        }

        ws.send(JSON.stringify(response));
    } catch (err) {
        loggerChild.error({ err }, "Handler threw an exception");
        ws.send(
            JSON.stringify({
                op: WsEvent.ERROR,
                d: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: toErrorCodeValue(ErrorCode.INTERNAL_ERROR),
                },
            }),
        );
    }
}