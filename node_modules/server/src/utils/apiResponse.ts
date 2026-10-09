import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponseFormat<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  } | null;
  meta?: PaginationMeta | Record<string, unknown>;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta | Record<string, unknown>
): Response => {
  const payload: ApiResponseFormat<T> = {
    success: true,
    data,
    error: null,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: unknown
): Response => {
  const payload: ApiResponseFormat<null> = {
    success: false,
    data: null,
    error: {
      message,
      code,
      details,
    },
  };
  return res.status(statusCode).json(payload);
};
