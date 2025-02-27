import type { Handlers } from "$fresh/server.ts";

// Define the search result interface
interface SearchResult {
  title: string;
  path: string;
  snippet?: string;
}

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    
    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    try {
      // Call the Go server for search results
      const goServerUrl = Deno.env.get("GO_SERVER_URL") || "http://localhost:8081";
      const searchUrl = `${goServerUrl}/search?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`);
      }
      
      const results = await response.json();
      
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Search error:", error);
      
      // Return empty results on error
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
  },
}; 