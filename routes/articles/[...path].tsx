import { join } from "https://deno.land/std@0.218.2/path/mod.ts";
import { Partial } from "$fresh/runtime.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "../../components/Header.tsx";
import RelatedArticles from "../../islands/RelatedArticles.tsx";
import SearchModal from "../../islands/SearchModal.tsx";
import type { RouteContext } from "$fresh/server.ts";

// CSS and JS imports for articles
const cssLink = `<link href="/article.css" rel="stylesheet">`;
const graphJsFile = await Deno.readFile("./utils/articles/graph.js");
const graphJsContent = new TextDecoder().decode(graphJsFile);
const jsScript = `<script>${graphJsContent}</script>`;

// Path to static directory
const staticDir = "./static/articles";

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
    // Handle paths with single quotes by replacing them with escaped versions
    const sanitizedPath = articlePath.replace(/'/g, "\\'");
    
    // First try the direct path
    const directPath = `${join(staticDir, sanitizedPath)}.html`;
    try {
        await Deno.stat(directPath);
        return directPath;
    } catch (e) {
        if (!(e instanceof Deno.errors.NotFound)) {
            console.error("Error checking direct path:", e);
        }
    }
    
    // If not found, search in subdirectories
    try {
        const searchDirs = [];
        for await (const entry of Deno.readDir(staticDir)) {
            if (entry.isDirectory && entry.name.startsWith('search_results_')) {
                searchDirs.push(entry.name);
            }
        }
        
        // Try each search directory
        for (const dir of searchDirs) {
            const searchPath = `${join(staticDir, dir, sanitizedPath)}.html`;
            try {
                await Deno.stat(searchPath);
                return searchPath;
            } catch (e) {
                if (!(e instanceof Deno.errors.NotFound)) {
                    console.error(`Error checking path in ${dir}:`, e);
                }
            }
        }
        
        // If still not found, try with unescaped single quotes
        if (sanitizedPath !== articlePath) {
            for (const dir of searchDirs) {
                const searchPath = `${join(staticDir, dir, articlePath)}.html`;
                try {
                    await Deno.stat(searchPath);
                    return searchPath;
                } catch (e) {
                    if (!(e instanceof Deno.errors.NotFound)) {
                        console.error(`Error checking unescaped path in ${dir}:`, e);
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error searching for article:", e);
    }
    
    return null;
}

// Process HTML content for articles
function processArticleContent(htmlContent: string): string {
    // Remove inline styles for cleaner output
    const withoutStyles = htmlContent.replace(/<style[\s\S]*?<\/style>/g, "");
    
    // Add CSS and JS
    const withAssets = withoutStyles.replace("</title>", `</title>${cssLink}${jsScript}`);
    
    // Remove unnecessary elements
    const withoutHead = withAssets.replace(/\<head\>.+\<\/head\>/s, "");
    const withoutH1 = withoutHead.replace(/\<h1\>.+\<\/h1\>/s, "");
    
    // Remove any Google Fonts imports (now in CSS)
    const processed = withoutH1.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, "");
    
    // Process markdown links - convert [text](url) to <a href="url">text</a>
    // Split the content by HTML tags and only process text nodes
    let result = '';
    const parts = processed.split(/(<[^>]*>)/);
    
    for (let i = 0; i < parts.length; i++) {
        // If this is a text node (not inside an HTML tag), process markdown links
        if (i % 2 === 0) {
            // Handle markdown links with more complex text content
            // This regex handles links with text that might contain formatting but not other links
            parts[i] = parts[i].replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                // Ensure URL is properly formatted
                const formattedUrl = url.trim();
                // Return the HTML link
                return `<a href="${formattedUrl}" class="markdown-link">${text}</a>`;
            });
            
            // Convert placeholder quiz text (more than two consecutive underscores) to input fields
            parts[i] = parts[i].replace(/_{3,}/g, (match) => {
                const width = Math.min(Math.max(match.length * 8, 60), 200);
                return `<input type="text" class="quiz-input" style="width: ${width}px; display: inline-block;" />`;
            });
        }
        result += parts[i];
    }
    
    return result;
}

export default async function ArticlePage(req: Request, ctx: RouteContext) {
  const { path } = ctx.params;
  const url = new URL("../dummy.html", import.meta.url);

  try {
    const articlePath = `articles/${path}`;
    
    // Try to find the actual article file
    const articleFilePath = await findArticleFile(path);
    
    if (!articleFilePath) {
      console.error(`Article file not found: ${path}`);
      return new Response("Article not found", { status: 404 });
    }
    
    const lang = new URL(req.url).searchParams.get("lang") || "en";
    const articleTitle = extractTitle(path);
    
    // Process article content
    let content: string;
    
    try {
      // Check if file exists and get its last modified time
      const fileInfo = await Deno.stat(articleFilePath);
      const fileTimestamp = fileInfo.mtime?.getTime() || Date.now();
      
      // Check cache first for better performance
      const cachedData = contentCache.get(articleFilePath);
      if (cachedData && cachedData.timestamp >= fileTimestamp) {
        content = cachedData.content;
      } else {
        const file = await Deno.readFile(articleFilePath);
        const rawContent = new TextDecoder().decode(file);
        
        if (articleFilePath.endsWith(".html")) {
          content = processArticleContent(rawContent);
        } else {
          content = rawContent;
        }
        
        // Cache the transformed content with timestamp
        contentCache.set(articleFilePath, { content, timestamp: fileTimestamp });
      }
    } catch (fileError) {
      console.error("Error reading article file:", fileError);
      
      // Fall back to fetching via URL if file access fails
      try {
        const res = await fetch(new URL(`../../${articlePath}.md`, url));
        
        if (!res.ok) {
          return new Response("Article not found", { status: 404 });
        }
        
        content = await res.text();
      } catch (fetchError) {
        console.error("Error fetching article:", fetchError);
        return new Response("Error fetching article content", { status: 500 });
      }
    }
    
    // Fetch related articles
    let relatedArticles = [];
    try {
      const relatedArticlesRes = await fetch(
        new URL(`../../${articlePath}.related.json`, url),
      );
      
      if (relatedArticlesRes.ok) {
        relatedArticles = await relatedArticlesRes.json();
      } else {
        console.error("Error fetching related articles:", relatedArticlesRes.statusText);
      }
    } catch (relatedError) {
      console.error("Error fetching related articles:", relatedError);
      // Continue with empty related articles rather than failing the whole page
    }

    return (
      <>
        <Head>
          <title>{articleTitle} | Curiosit-e</title>
          <meta name="description" content={`Educational article about ${articleTitle}`} />
          <link rel="stylesheet" href="/styles.css" />
          <link rel="stylesheet" href="/article.css" />
          <script src="/article-enhancer.js" defer />
        </Head>
        <div class="layout">
          <Header lang={lang} />
          <SearchModal />
          <main class="content">
            <div className="min-h-screen bg-white dark:bg-gray-900">
              <main className="container mx-auto px-4 py-6 md:py-8">
                <article className="mx-auto max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 pt-6 md:px-8 md:pt-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                      {articleTitle}
                    </h1>
                  </div>
                  <Partial name="article-content">
                    <div 
                      dangerouslySetInnerHTML={{__html: content}} 
                      className="p-6 md:p-8 article-content dark:text-gray-200" 
                    />
                  </Partial>
                </article>
              </main>
              <footer className="bg-gray-100 dark:bg-gray-800 py-6 mt-8">
                <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
                  <p>&copy; {new Date().getFullYear()} Curiosit-e. All rights reserved.</p>
                </div>
              </footer>
            </div>
            <div class="related-articles">
              <h2>Related Articles</h2>
              <RelatedArticles relatedArticles={relatedArticles} count={3} />
            </div>
          </main>
        </div>
      </>
    );
  } catch (error) {
    console.error("Unhandled error in ArticlePage:", error);
    return new Response("Error processing article", { status: 500 });
  }
}
