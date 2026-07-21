import { OpenAIConfigurationError, refreshSandboxBriefWithOpenAI } from "../../../../lib/llm/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const refreshToken = process.env.SANDBOX_REFRESH_TOKEN;
  if (!refreshToken) {
    return Response.json(
      { error: "Live refresh is disabled. Set SANDBOX_REFRESH_TOKEN to enable it for a private demo." },
      { status: 503 },
    );
  }

  if (request.headers.get("x-helm-demo-token") !== refreshToken) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    return Response.json(await refreshSandboxBriefWithOpenAI());
  } catch (error) {
    const status = error instanceof OpenAIConfigurationError ? 503 : 502;
    const message = error instanceof Error ? error.message : "Live refresh failed.";
    return Response.json({ error: message }, { status });
  }
}
