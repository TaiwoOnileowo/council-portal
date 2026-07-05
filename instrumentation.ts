import { type Instrumentation } from "next";

// pino + `after()` are Node-only — this app never opts into the Edge
// runtime, but guard anyway per Next's documented pattern for this hook.
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { logger } = await import("@/lib/logger");
  const isError = err instanceof Error;
  const digest =
    isError && "digest" in err ? (err as { digest?: string }).digest : undefined;

  logger.error("[uncaught]", isError ? err.message : "Unknown error", {
    digest,
    stack: isError ? err.stack : undefined,
    err: isError ? undefined : err,
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    routePath: context.routePath,
  });
};
