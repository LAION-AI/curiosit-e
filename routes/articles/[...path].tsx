import { join } from "https://deno.land/std@0.218.2/path/mod.ts";
import { Partial } from "$fresh/runtime.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "../../components/Header.tsx";

// CSS and JS imports for articles
const cssLink = `<link href="/article.css" rel="stylesheet">`;
const jsFile = await Deno.readFile("./utils/articles/graph.js");
const jsContent = new TextDecoder().decode(jsFile);
const jsScript = `<script>${jsContent}</script>`;

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
            parts[i] = parts[i].replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        }
        result += parts[i];
    }
    
    return result;
}

export default async function ArticlePage(_req: Request, { params }: { params: { path: string } }) {
    const filepath = `${join(staticDir, params.path)}.html`;
    const lang = new URL(_req.url).searchParams.get("lang") || "en";
    const articleTitle = extractTitle(params.path);
    
    try {
        // Read and process the article content
        let content: string;
        
        // Check if file exists and get its last modified time
        const fileInfo = await Deno.stat(filepath);
        const fileTimestamp = fileInfo.mtime?.getTime() || Date.now();
        
        // Check cache first for better performance
        const cachedData = contentCache.get(filepath);
        if (cachedData && cachedData.timestamp >= fileTimestamp) {
            content = cachedData.content;
        } else {
            const file = await Deno.readFile(filepath);
            const rawContent = new TextDecoder().decode(file);
            
            if (filepath.endsWith(".html")) {
                content = processArticleContent(rawContent);
            } else {
                content = rawContent;
            }
            
            // Cache the transformed content with timestamp
            contentCache.set(filepath, { content, timestamp: fileTimestamp });
        }

        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Head>
                    <title>{articleTitle} | Curiosit-e</title>
                    <meta name="description" content={`Educational article about ${articleTitle}`} />
                    <link rel="stylesheet" href="/styles.css" />
                </Head>
                
                <Header lang={lang} />
                
                <main className="container mx-auto px-4 py-6 md:py-8">
                    <article className="mx-auto max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 pt-6 md:px-8 md:pt-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                                {articleTitle}
                            </h1>
                        </div>
                        <Partial name="article-content">
                            {/* 
                              * Using dangerouslySetInnerHTML is necessary here as we're rendering 
                              * pre-generated HTML content from article files. The content is 
                              * processed server-side and doesn't contain user-generated input.
                              */}
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
        );
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            return new Response("Not found", { status: 404 });
        }
        console.error("Error serving file:", e);
        return new Response("Internal server error", { status: 500 });
    }
}
