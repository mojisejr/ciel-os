export const supportedEventTypes = ["closeout", "decision"] as const;

export type SupportedEventType = (typeof supportedEventTypes)[number];

export interface EventValidationError {
  path: string;
  message: string;
}

export interface EventValidationResult {
  errors: EventValidationError[];
  files: string[];
}
