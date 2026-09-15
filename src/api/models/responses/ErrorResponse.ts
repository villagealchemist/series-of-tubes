export interface FieldError {
  path: string;
  message: string;
}

export interface ValidationErrorResponse {
  code: "VALIDATION_FAILED";
  message: string;
  fields: FieldError[];
}

export interface ErrorResponse {
  code: string;
  message: string;
}
