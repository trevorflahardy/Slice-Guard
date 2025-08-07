/**
 * @fileoverview Denotes custom error codes for the application.
 * These error codes are used to identify specific errors that may occur
 * during the execution of the application.
 */

export enum ErrorCode {
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNIMPLEMENTED = 'UNIMPLEMENTED',
    UNAUTHORIZED = 'UNAUTHORIZED',
}

export type ErrorCodeType = keyof typeof ErrorCode;
export type ErrorCodeValue = (typeof ErrorCode)[ErrorCodeType];

export type ErrorCodeMappingValue = number;

export const ErrorCodeMapping: Record<ErrorCodeValue, ErrorCodeMappingValue> = {
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.UNIMPLEMENTED]: 501,
    [ErrorCode.UNAUTHORIZED]: 401,
};

export function toErrorCodeValue(code: ErrorCodeValue): ErrorCodeMappingValue {
    return ErrorCodeMapping[code];
}
