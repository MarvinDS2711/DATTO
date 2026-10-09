const SENSITIVE_KEY = /pass(word)?|pwd|secret|token|api[-_]?key|authorization|cookie|session/i;
export const REDACTED = "[MASQUÉ]";

/**
 * Copie profonde d'un objet en masquant les valeurs dont la clé évoque un secret.
 * Utilisé avant toute journalisation.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[PROFONDEUR MAX]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? REDACTED : redact(v, depth + 1)]),
    );
  }
  return value;
}
