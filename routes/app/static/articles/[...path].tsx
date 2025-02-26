import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const path = ctx.params.path;
    
    // Redirect to the correct article path
    const newPath = `/articles/${path}`;
    return Response.redirect(new URL(newPath, url.origin), 307);
  },
}; 