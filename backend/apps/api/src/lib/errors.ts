import { randomUUID } from 'node:crypto';
import type { ApiErrorBody, ErrorResponse } from '@lattice/contracts';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorBody['code'];
  public readonly details?: Array<{ path: string; message: string }>;
  public readonly requestId?: string;

  constructor(
    statusCode: number,
    code: ApiErrorBody['code'],
    message: string,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: Array<{ path: string; message: string }>) =>
  new ApiError(400, 'INVALID_QUERY', message, details);

export const notFound = (message = 'Resource not found') =>
  new ApiError(404, 'NOT_FOUND', message);

export const unauthorized = (message = 'Unauthorized') => new ApiError(401, 'UNAUTHORIZED', message);

export const internal = (message = 'Internal server error') =>
  new ApiError(500, 'INTERNAL_ERROR', message);

export function toErrorBody(err: ApiError, requestId: string): ApiErrorBody {
  return {
    code: err.code,
    message: err.message,
    details: err.details,
    requestId,
  };
}

export function newRequestId(): string {
  return randomUUID();
}

export type { ErrorResponse };
