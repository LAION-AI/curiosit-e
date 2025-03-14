import { Partial } from "$fresh/runtime.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "../../components/Header.tsx";
import type { RouteContext } from "$fresh/server.ts";
import { htmlPipeline } from "./(_utils)/htmlPipeline.ts";
// Define ARTICLES_SERVER_URL here where Deno is available
const ARTICLES_SERVER_URL = Deno.env.get("ARTICLES_SERVER_URL") || "http://localhost:8002";
const ARTICLES_STORAGE_SERVER_URL = Deno.env.get("ARTICLES_STORAGE_SERVER_URL") || "http://localhost:8001";
// CSS and JS imports for articles

// Cache for transformed content to reduce processing overhead
const contentCache = new Map<string, { content: string, timestamp: number }>();

// Helper function to extract title from path
function extractTitle(path: string): string {
    const parts = path.split('/');
    
    const filename = parts[parts.length - 1];
    
    // Replace underscores with spaces and capitalize words
    return filename
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Helper function to find the actual file path
async function findArticleFile(articlePath: string): Promise<string | null> {
  const url = new URL(`${articlePath}.html`, ARTICLES_STORAGE_SERVER_URL);
  console.log("url", url);
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }
  const content = await res.text();
  return content;
}


export default async function ArticlePage(_: Request, ctx: RouteContext) {
  const { path } = ctx.params;

  try {
    
    // Try to find the actual article file
    let content = await findArticleFile(path)
    if (!content) {
      return new Response("Article not found", { status: 404 });
    }
    content = htmlPipeline(content);
    
    try {
        // Cache the transformed content with timestamp
        if (content) {
          contentCache.set(path, { content, timestamp: Date.now() });
        }
    } catch (fileError) {
      console.error("Error reading article file:", fileError);
      
      // Fall back to fetching via URL if file access fails
      try {
        const articlePath = `articles/${path}`;
        const res = await fetch(ARTICLES_SERVER_URL + articlePath);
        
        if (!res.ok) {
          return new Response("Article not found", { status: 404 });
        }
        
        content = await res.text();
      } catch (fetchError) {
        console.error("Error fetching article:", fetchError);
        return new Response("Error fetching article content", { status: 500 });
      }
    }
    
    const articleTitle = extractTitle(path);

    return (
      <>
        <Head>
          <title>{articleTitle} | Curiosit-e</title>
          <meta name="description" content={`Educational article about ${articleTitle}`} />
          <link rel="stylesheet" href="/styles.css" />
          <link rel="stylesheet" href="/article.css" />
        </Head>
        <div class="layout">
          <Header lang="en" articlesServerUrl={ARTICLES_SERVER_URL} />
          <main class="content">
            <div className="min-h-screen bg-white dark:bg-gray-900">
              <main className="container mx-auto px-4 py-6 md:py-8">
                <article className="mx-auto max-w-4xl bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                  <div className="px-6 pt-6 md:px-8 md:pt-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                      {articleTitle}
                    </h1>
                  </div>
                    <div 
                      dangerouslySetInnerHTML={{__html: content}} 
                      className="p-6 md:p-8 article-content dark:text-gray-200" 
                    />
                </article>
              </main>
              <footer className="bg-gray-100 dark:bg-gray-800 py-6 mt-8">
                <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
                  <p>&copy; {new Date().getFullYear()} Curiosit-e. All rights reserved.</p>
                </div>
              </footer>
            </div>
          </main>
        </div>
        <script src="/article-enhancer.js" defer />
      </>
    );
  } catch (error) {
    console.error("Unhandled error in ArticlePage:", error);
    return new Response("Error processing article", { status: 500 });
  }
}
