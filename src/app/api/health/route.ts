export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    app: "FWM's Claude Chat Archive Viewer",
    localFirst: true,
    telemetry: false
  });
}

