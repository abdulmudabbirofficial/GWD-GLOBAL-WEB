/**
 * Typed application errors. Route handlers throw these; the HTTP layer maps
 * them to a consistent `{ error: { code, message, details, requestId } }` body.
 * Anything that is not an AppError is treated as an internal error and its
 * message is never leaked to the client.
 */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL';

const STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL: 500,
};

export interface FieldIssue {
  path: string;
  message: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: FieldIssue[] | Record<string, unknown>;
  readonly headers?: Record<string, string>;

  constructor(code: ErrorCode, message: string, options: { details?: AppError['details']; headers?: Record<string, string>; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS[code];
    this.details = options.details;
    this.headers = options.headers;
  }
}

export const notFound = (what = 'Resource') => new AppError('NOT_FOUND', `${what} not found.`);
export const forbidden = () => new AppError('FORBIDDEN', 'You do not have permission to perform this action.');
export const unauthenticated = () => new AppError('UNAUTHENTICATED', 'Sign in to continue.');
