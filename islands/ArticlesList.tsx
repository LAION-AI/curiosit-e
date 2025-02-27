import { useEffect, useRef, useState, useCallback } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import RelatedArticles from "./RelatedArticles.tsx";
import type { Article } from "../routes/articles/index.tsx";

interface ArticlesListProps {
  initialArticles: Article[];
}

export default function ArticlesList({ initialArticles }: ArticlesListProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const articlesPerPage = 9;

  // Function to fetch more articles
  const fetchMoreArticles = useCallback(async () => {
    if (!IS_BROWSER || isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      // Use a different title for each page to get different articles
      const titles = ["Management", "Science", "History", "Mathematics", "Literature", "Technology"];
      const titleIndex = page % titles.length;
      
      const articlesServerUrl = window.location.origin.includes("localhost") 
        ? "http://localhost:8081" 
        : window.location.origin.replace(":8000", ":8081");
      
      const res = await fetch(
        `${articlesServerUrl}/related?title=${titles[titleIndex]}&page=${page}`
      );
      
      if (!res.ok) {
        console.error(`Error fetching more articles: ${res.status}`);
        setHasMore(false);
        return;
      }
      
      const data = await res.json();
      
      if (data.length === 0) {
        setHasMore(false);
        return;
      }
      
      const newArticles = data.map((article: { img: string; path: string }) => {
        let path = article.path.replace(
          "/Users/michael/Software/opensource/school-bud-e-frontend/static",
          ""
        );
        let title = article.path.split("/").pop();
        title = title?.replace(".html", "");
        title = title?.replace("report_", "");
        title = title?.replace(/_/g, " ");

        path = path.replace(".html", "");
        return { title, path, img: article.img };
      });
      
      // Filter out duplicates
      const uniqueNewArticles = newArticles.filter(
        (newArticle: Article) => !articles.some(
          (existingArticle) => existingArticle.path === newArticle.path
        )
      );
      
      if (uniqueNewArticles.length === 0) {
        setHasMore(false);
        return;
      }
      
      setArticles((prevArticles) => [...prevArticles, ...uniqueNewArticles]);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error fetching more articles:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, articles]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!IS_BROWSER || !loaderRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          fetchMoreArticles();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loaderRef.current);
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [fetchMoreArticles, isLoading]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <RelatedArticles relatedArticles={articles} count={articles.length} />
      </div>
      
      {hasMore && (
        <div 
          ref={loaderRef} 
          className="flex justify-center items-center py-8"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          ) : (
            <button
              type="button"
              onClick={fetchMoreArticles}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Load More Articles
            </button>
          )}
        </div>
      )}
      
      {!hasMore && articles.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          You've reached the end of our article collection.
        </div>
      )}
    </div>
  );
} 