export interface ProjectValidationError {
  path: string;
  message: string;
}

export interface ProjectValidationResult {
  errors: ProjectValidationError[];
  files: string[];
}
