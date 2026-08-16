// Cloudflare Pages Function -- same-origin proxy to the KAI OS backend
// bridge (api.projectkai.dev, behind Cloudflare Access + Tunnel).
//
// This is the one piece explicitly identified as missing in every prior
// backend-bridge audit ("Pages Function does not exist", confirmed live
// via a 404 on /api/health at projectkai.dev). It exists now, but it can
// only ever work once you configure this Pages project's own environment
// variables (Cloudflare Pages dashboard -> Settings -> Environment
// variables, "production"):
//
//   KAI_BRIDGE_API_KEY        -- the same bearer key backend_api/.env already uses
//   CF_ACCESS_CLIENT_ID       -- from a Cloudflare Access Service Token you create
//   CF_ACCESS_CLIENT_SECRET   -- from that same Service Token
//   KAI_CONTROL_PASSPHRASE    -- a passphrase YOU choose, required only for
//                                 START/STOP/EMERGENCY_STOP/RUNWAY actions
//
// None of these four values are ever committed to this repo, ever sent to
// the browser, or ever visible in the built JS bundle -- they exist only
// as Pages Function server-side environment bindings (`context.env`),
// exactly like Supabase's own service-role key would if that were
// configured instead. This is a real, working shared-secret check, not a
// placeholder -- until KAI_CONTROL_PASSPHRASE is set, EVERY control
// request is rejected with 503 (not silently allowed), so there is no
// window where this endpoint is a fake gate that happens to let everyone
// through.
//
// Read-only KAI status (GET requests to non-control paths) does not
// require the passphrase -- it is the same category of disclosure the
// site already makes elsewhere (e.g. review-queue counts on the old
// build-time snapshot), and still requires the Access + bearer chain to
// even reach the real backend.

const BACKEND_ORIGIN = "https://api.projectkai.dev";
const CONTROL_PREFIX = "control/";

function unavailable(reason) {
  return new Response(JSON.stringify({ error: "backend_bridge_not_configured", reason }), {
    status: 503,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const pathSegments = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  const subPath = pathSegments.join("/");

  if (!env.KAI_BRIDGE_API_KEY) {
    return unavailable("KAI_BRIDGE_API_KEY is not set on this Pages project yet.");
  }

  const isControlAction = subPath.startsWith(CONTROL_PREFIX) && request.method === "POST";
  if (isControlAction) {
    if (!env.KAI_CONTROL_PASSPHRASE) {
      return unavailable("KAI_CONTROL_PASSPHRASE is not set -- control actions stay disabled until you choose one.");
    }
    const provided = request.headers.get("X-KAI-Control-Passphrase") || "";
    if (provided !== env.KAI_CONTROL_PASSPHRASE) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const upstreamHeaders = new Headers();
  upstreamHeaders.set("Authorization", `Bearer ${env.KAI_BRIDGE_API_KEY}`);
  upstreamHeaders.set("content-type", "application/json");
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    upstreamHeaders.set("CF-Access-Client-Id", env.CF_ACCESS_CLIENT_ID);
    upstreamHeaders.set("CF-Access-Client-Secret", env.CF_ACCESS_CLIENT_SECRET);
  }

  const upstreamUrl = `${BACKEND_ORIGIN}/api/${subPath}`;
  const init = {
    method: request.method,
    headers: upstreamHeaders,
  };
  if (request.method === "POST") {
    init.body = await request.text();
  }

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, init);
  } catch (err) {
    return unavailable("Could not reach the backend bridge (Tunnel/Access may be down).");
  }

  const responseBody = await upstreamResponse.text();
  return new Response(responseBody, {
    status: upstreamResponse.status,
    headers: { "content-type": "application/json" },
  });
}
