/**
 * API error response structure
 */
export interface ApiError {
  error: {
    /** Machine-readable error code */
    code: string;

    /** Human-readable error message */
    message: string;

    /** Optional additional details */
    details?: string;

    /** Optional field name for validation errors */
    field?: string;
  };
}