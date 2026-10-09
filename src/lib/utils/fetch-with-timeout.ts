import { DattoTimeoutError } from "@/lib/datto/errors";

/**
 * `fetch` avec délai d'expiration. Utilisé par le futur client HTTP Datto pour
 * qu'aucun appel ne reste bloqué pendant une astreinte.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit & { timeoutMs: number },
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const { timeoutMs, signal, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort, { once: true });

  try {
    return await fetchImpl(input, { ...rest, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new DattoTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}
