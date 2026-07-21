import { getSandboxBrief } from "../../../../lib/sandbox/pipeline";

export const dynamic = "force-static";

export function GET() {
  return Response.json(getSandboxBrief(), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
