/** Point de santé, appelé par le ping de maintien en éveil (voir instrumentation.ts). */
export function GET() {
  return Response.json({ status: "ok" });
}
