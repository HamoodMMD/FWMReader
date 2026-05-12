export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    app: "Claude Chat Archive Viewer",
    localFirst: true,
    telemetry: false
  });
}

