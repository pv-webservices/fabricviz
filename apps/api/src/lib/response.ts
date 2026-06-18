import type { ApiResponse } from '@fabricviz/domain';

/**
 * Build a standard success response.
 */
export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/**
 * Build a standard error response.
 */
export function error(code: string, message: string): ApiResponse<never> {
  return { success: false, error: { code, message } };
}
