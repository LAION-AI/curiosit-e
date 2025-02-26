import { join } from "https://deno.land/std@0.218.2/path/mod.ts";
import { Partial } from "$fresh/runtime.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "../../components/Header.tsx";

const cssReset = `<link href="/article.css" rel="stylesheet">`;

const jsFile = await Deno.readFile("./utils/articles/graph.js");
const jsContent = new TextDecoder().decode(jsFile);
const js = `<script>${jsContent}</script>`;

const meta = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap" rel="stylesheet">`

const staticDir = "./static/articles";

// Cache for transformed content to reduce processing overhead
const contentCache = new Map<string, string>();

export default async function ArticlePage(_req: Request, { params }: { params: { path: string } }) {
    const filepath = `${join(staticDir, params.path)}.html`;
    const lang = new URL(_req.url).searchParams.get("lang") || "en";
    
    // Check cache first for better performance
    if (contentCache.has(filepath)) {
        const cachedContent = contentCache.get(filepath) || '';
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Head>
                    <title>Curiosit-e Article</title>
                    <meta name="description" content="Educational article" />
                    <link rel="stylesheet" href="/styles.css" />
                </Head>
                
                <Header lang={lang} />
                
                <main className="container mx-auto px-4 py-6 md:py-8">
                    <article className="mx-auto max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                        <Partial name="article-content">
                            {/* 
                              * Using dangerouslySetInnerHTML is necessary here as we're rendering 
                              * pre-generated HTML content from article files. The content is 
                              * processed server-side and doesn't contain user-generated input.
                              */}
                            <div 
                                dangerouslySetInnerHTML={{__html: cachedContent}} 
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
    }
    
    try {
        const file = await Deno.readFile(filepath);
        let content = new TextDecoder().decode(file);

        if (filepath.endsWith(".html")) {
            // Apply all transformations in a more efficient manner
            // Remove inline styles for cleaner output
            content = content.replace(/<style[\s\S]*?<\/style>/g, "");
            
            // Add metadata and styling in a single operation
            content = content.replace("</title>", `</title>${meta}${cssReset}${js}`);
            
            // Remove unnecessary elements
            content = content.replace(/\<head\>.+\<\/head\>/s, "");
            content = content.replace(/\<h1\>.+\<\/h1\>/s, "");
        }
        
        // Cache the transformed content
        contentCache.set(filepath, content);

        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Head>
                    <title>Curiosit-e Article</title>
                    <meta name="description" content="Educational article" />
                    <link rel="stylesheet" href="/styles.css" />
                </Head>
                
                <Header lang={lang} />
                
                <main className="container mx-auto px-4 py-6 md:py-8">
                    <article className="mx-auto max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
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
