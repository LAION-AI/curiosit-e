// @ts-ignore: Ignoring type imports warning
import type { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/src/runtime/head.ts";
import { Partial } from "$fresh/runtime.ts";
import RelatedArticles from "../islands/RelatedArticles.tsx";
import Header from "../components/Header.tsx";

// Define ARTICLES_SERVER_URL at the top level
const ARTICLES_SERVER_URL = Deno.env.get("ARTICLES_SERVER_URL") || "http://localhost:8002";
const ARTICLES_STORAGE_SERVER_URL = Deno.env.get("ARTICLES_STORAGE_SERVER_URL") || "http://localhost:8001";

type Article = {
	title: string;
	path: string;
	img: string;
};

// Cache for related articles to reduce API calls
const articlesCache = new Map<string, Article[]>();

const useRelatedArticles = async (title = "Time Management"): Promise<Article[]> => {
	// Check cache first
	const cacheKey = title.toLowerCase();
	if (articlesCache.has(cacheKey)) {
		return articlesCache.get(cacheKey) || [];
	}

	try {
		const urlencoded = encodeURIComponent(title.split(" ").pop() ?? "");
		// Use the consistent ARTICLES_SERVER_URL
		const res = await fetch(
			`${ARTICLES_SERVER_URL}/related?title=${urlencoded}`,
		);
		
		if (!res.ok) {
			console.error(`Error fetching related articles: ${res.status}`);
			return [];
		}
		
		const data = await res.json();

		const titles = data.map((article: { img: string; path: string }) => {
			let path = article.path.replace(
				"/Users/michael/Software/opensource/school-bud-e-frontend/static",
				"",
			);
			let title = article.path.split("/").pop();
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
		console.error("Error fetching related articles:", error);
		return [];
	}
};

export default async function Home(props: PageProps) {
	// Safely get the lang parameter with a fallback to "en"
	const lang = props?.url?.searchParams?.get("lang") || "en";
	const articles = await useRelatedArticles();

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Head>
				<title>Curiosit-e</title>
				<meta name="description" content="Explore educational resources and articles" />
				<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap" rel="stylesheet" />
			</Head>

			<Header lang={lang} articlesServerUrl={ARTICLES_SERVER_URL} articlesStorageServerUrl={ARTICLES_STORAGE_SERVER_URL} />

			<main className="container mx-auto px-4 py-8 md:py-12">
				<div className="max-w-4xl mx-auto mb-10 text-center">
					<h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-white">
						Welcome to Curiosit-e
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-300">
						Explore our collection of educational resources to enhance your learning journey
					</p>
				</div>

				<div className="max-w-6xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
						<Partial name="articles">
							<RelatedArticles relatedArticles={articles} count={9} />
						</Partial>
					</div>
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
