/**
 * Unified error code enum.
 * `0` means success; non-zero values represent specific error categories.
 */
export enum ErrorCode {
  SUCCESS = 0,
  // 1xxx - common errors
  BAD_REQUEST = 1000,
  VALIDATION_FAILED = 1001,
  UNAUTHORIZED = 1002,
  FORBIDDEN = 1003,
  NOT_FOUND = 1004,
  CONFLICT = 1005,
  // 5xxx - server errors
  INTERNAL_ERROR = 5000,
  DATABASE_ERROR = 5001,
  REDIS_ERROR = 5002,
  SERVICE_UNAVAILABLE = 5003,
}
