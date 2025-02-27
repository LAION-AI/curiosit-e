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
  const [usedTitles, setUsedTitles] = useState<Set<string>>(new Set(["Time Management"]));
  const loaderRef = useRef<HTMLDivElement>(null);
  const articlesPerPage = 9;
  const maxRetries = 3;
  const [retryCount, setRetryCount] = useState(0);

  // A wider variety of search terms to get more diverse articles
  const searchTerms = [
    "Management", "Science", "History", "Mathematics", "Literature", "Technology",
    "Biology", "Physics", "Chemistry", "Art", "Music", "Philosophy", 
    "Psychology", "Sociology", "Economics", "Geography", "Politics", "Religion",
    "Computer", "Internet", "Data", "Analysis", "Research", "Education",
    "Health", "Medicine", "Environment", "Climate", "Energy", "Space"
  ];

  // Function to fetch more articles
  const fetchMoreArticles = useCallback(async () => {
    if (!IS_BROWSER || isLoading || (!hasMore && retryCount >= maxRetries)) return;
    
    setIsLoading(true);
    try {
      // Get a title we haven't used yet
      let titleIndex = page % searchTerms.length;
      let searchTitle = searchTerms[titleIndex];
      
      // Try to find a title we haven't used yet
      let attempts = 0;
      while (usedTitles.has(searchTitle) && attempts < searchTerms.length) {
        titleIndex = (titleIndex + 1) % searchTerms.length;
        searchTitle = searchTerms[titleIndex];
        attempts++;
      }
      
      // If we've used all titles, just use the current one
      if (usedTitles.has(searchTitle) && usedTitles.size >= searchTerms.length) {
        // We've used all titles, so we'll reuse one but with a different page parameter
        searchTitle = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      }
      
      // Add this title to the used titles set
      setUsedTitles(prev => new Set([...prev, searchTitle]));
      
      const articlesServerUrl = window.location.origin.includes("localhost") 
        ? "http://localhost:8081" 
        : window.location.origin.replace(":8000", ":8081");
      
      console.log(`Fetching more articles with title: ${searchTitle}, page: ${page}`);
      
      const res = await fetch(
        `${articlesServerUrl}/related?title=${encodeURIComponent(searchTitle)}&page=${page}`
      );
      
      if (!res.ok) {
        console.error(`Error fetching more articles: ${res.status}`);
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setPage(prev => prev + 1);
        } else {
          setHasMore(false);
        }
        return;
      }
      
      const data = await res.json();
      
      if (!data || data.length === 0) {
        console.log("No more articles found for this search term");
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setPage(prev => prev + 1);
        } else {
          setHasMore(false);
        }
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
      
      // Filter out duplicates by path
      const existingPaths = new Set(articles.map(article => article.path));
      const uniqueNewArticles = newArticles.filter(
        (newArticle: Article) => !existingPaths.has(newArticle.path)
      );
      
      if (uniqueNewArticles.length === 0) {
        console.log("No unique new articles found");
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setPage(prev => prev + 1);
        } else {
          setHasMore(false);
        }
        return;
      }
      
      // Reset retry count since we found articles
      setRetryCount(0);
      setArticles((prevArticles) => [...prevArticles, ...uniqueNewArticles]);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error fetching more articles:", error);
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, articles, usedTitles, retryCount]);

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