// @ts-ignore: Ignoring type imports warning
import type { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/src/runtime/head.ts";
import ArticlesList from "../../islands/ArticlesList.tsx";
import Header from "../../components/Header.tsx";

// Define ARTICLES_SERVER_URL at the top level
const ARTICLES_SERVER_URL = Deno.env.get("ARTICLES_SERVER_URL") || "http://localhost:8002";
const ARTICLES_STORAGE_SERVER_URL = Deno.env.get("ARTICLES_STORAGE_SERVER_URL") || "http://localhost:8001";
export type Article = {
	title: string;
	public_path: string;
	base_name: string;
	img: string;
};

// Cache for related articles to reduce API calls
const articlesCache = new Map<string, Article[]>();

export const useRelatedArticles = async (title = "Time Management"): Promise<Article[]> => {
	// Check cache first
	const cacheKey = title.toLowerCase();
	if (articlesCache.has(cacheKey)) {
		return articlesCache.get(cacheKey) || [];
	}

	try {
		const urlencoded = encodeURIComponent(title.split(" ").pop() ?? "");
		// Use the consistent ARTICLES_SERVER_URL
		const res = await fetch(
			`${ARTICLES_SERVER_URL}/query?q=${urlencoded}&k=5`,
		);
		
		if (!res.ok) {
			console.error(`Error fetching related articles: ${res.status}`);
			return [];
		}
		
		const data = await res.json();

		const titles = data.german.map((article: { img: string; public_path: string; base_name: string }) => {
			console.log(article);
			let path = article.public_path;
			let title = article.base_name.split("/").pop();
			title = title?.replace(".html", "");
			title = title?.replace("report_", "");
			title = title?.replace(/_/g, " ");

			path = path.replace(".html", "");
			return { title, path, img: article.img };
		});

		// Cache the results
		articlesCache.set(cacheKey, titles);
		return titles;
	} catch (error) {
		console.error(error);
		return [];
	}
};

export default async function Articles(props: PageProps) {
	// Safely get the lang parameter with a fallback to "en"
	const lang = props?.url?.searchParams?.get("lang") || "en";
	const initialArticles = await useRelatedArticles();

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Head>
				<title>Articles | Curiosit-e</title>
				<meta name="description" content="Browse our collection of educational articles" />
				<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap" rel="stylesheet" />
			</Head>

			<Header lang={lang} articlesServerUrl={ARTICLES_SERVER_URL} />

			<main className="container mx-auto px-4 py-8 md:py-12">
				<div className="max-w-4xl mx-auto mb-10 text-center">
					<h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-white font-serif">
						All Articles
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-300">
						Browse our complete collection of educational articles
					</p>
				</div>

				<div className="max-w-6xl mx-auto">
					<ArticlesList initialArticles={initialArticles} />
				</div>
			</main>

			<footer className="bg-white dark:bg-gray-800 py-8 mt-12 border-t border-gray-200 dark:border-gray-700">
				<div className="container mx-auto px-4">
					<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
						<div className="mb-4 md:mb-0">
							<p className="text-gray-600 dark:text-gray-300">&copy; {new Date().getFullYear()} Curiosit-e. All rights reserved.</p>
						</div>
						<div className="flex space-x-4">
							<a href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
								Home
							</a>
							<a href="/articles" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
								Articles
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
