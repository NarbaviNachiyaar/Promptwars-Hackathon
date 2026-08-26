type ErrorReportOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

/**
 * Reports a client-side error to the browser console (and, if you wire one up,
 * to your own error-tracking service e.g. Sentry). Kept as a small wrapper so
 * call sites don't need to change if you add a real provider later.
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ErrorReportOptions = {},
) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[error-reporting]", message, {
    route: window.location.pathname,
    ...context,
    ...options,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
