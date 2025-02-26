import type { FreshContext } from "$fresh/server.ts";


// Middleware function to handle CORS
export async function handler(req: Request, ctx: FreshContext) {
  const origin = req.headers.get("Origin") || "*";

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return new Response(null, { status: 204, headers });
  }

  // For other requests, proceed with the request
  const resp = await ctx.next();
  
  // Create a completely new response with the same data but new headers
  const newResp = new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
  });
  
  // Copy all original headers
  for (const [key, value] of resp.headers.entries()) {
    newResp.headers.set(key, value);
  }
  
  // Add CORS headers
  newResp.headers.set("Access-Control-Allow-Origin", origin);
  newResp.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  newResp.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  return newResp;
}
