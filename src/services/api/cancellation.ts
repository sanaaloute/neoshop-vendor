/**
 * Request cancellation helpers for `fetch` / axios `signal` option (Axios ≥ 0.22).
 */

/** Combine multiple AbortSignals — aborts when any source aborts. */
export function anySignal(
  ...signals: (AbortSignal | null | undefined)[]
): AbortSignal {
  const filtered = signals.filter((s): s is AbortSignal => Boolean(s));
  if (filtered.length === 0) return new AbortController().signal;
  if (filtered.length === 1) return filtered[0]!;

  const controller = new AbortController();
  for (const sig of filtered) {
    if (sig.aborted) {
      controller.abort(sig.reason);
      return controller.signal;
    }
    sig.addEventListener("abort", () => controller.abort(sig.reason), {
      once: true,
    });
  }
  return controller.signal;
}

/** Child aborts when parent aborts; optionally abort parent from child is not done here. */
export function createLinkedAbortController(parent?: AbortSignal | null) {
  const controller = new AbortController();
  if (parent) {
    if (parent.aborted) controller.abort(parent.reason);
    else
      parent.addEventListener("abort", () => controller.abort(parent.reason), {
        once: true,
      });
  }
  return controller;
}
