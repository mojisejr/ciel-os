function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * The Git position an event records for itself.
 *
 * Wake reconciles the newest event against live Git through this reference, and
 * the portfolio reader uses it as a lane checkpoint. An event without one is
 * still valid, but it makes no ancestry claim.
 */
export function findEventCheckpoint(event: Record<string, unknown>): string | null {
  const evidence = event.evidence;

  if (!isRecord(evidence)) {
    return null;
  }

  const repository = evidence.repository;
  if (isRecord(repository)) {
    return readString(repository, "head") ?? readString(repository, "base_revision") ?? readString(evidence, "base_revision");
  }

  return readString(evidence, "base_revision") ?? readString(evidence, "prior_checkpoint");
}
