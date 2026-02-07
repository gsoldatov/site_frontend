/**
 * Returns a route handler response object with specified `status` & `error` text.
 */
export const getErrorResponse = (status: number, error: string) => ({ status, body: { _error: error }});
