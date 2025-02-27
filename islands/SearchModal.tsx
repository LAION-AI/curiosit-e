import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface SearchResult {
  title: string;
  path: string;
  snippet?: string;
}

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!IS_BROWSER) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with cmd+k or ctrl+k
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      // Close with escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data || []);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle keyboard navigation in results
  const handleResultsKeyDown = (e: KeyboardEvent) => {
    if (!results || !results.length) return;

    // Arrow down
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    }
    // Arrow up
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
    // Enter to navigate
    else if (e.key === "Enter") {
      e.preventDefault();
      if (results && selectedIndex >= 0 && selectedIndex < results.length && results[selectedIndex]) {
        navigateToArticle(results[selectedIndex].path);
      }
    }
  };

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results && results.length > 0) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, results]);

  // Helper function to navigate to an article with proper encoding
  const navigateToArticle = (path: string) => {
    const encodedPath = encodeURIComponent(path);
    window.location.href = `/articles/${encodedPath}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 px-4"
      onClick={() => setIsOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
      aria-modal="true"
      aria-labelledby="search-modal-title"
    >
      <dialog 
        open
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <svg 
            className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Search article titles and metadata..."
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            onKeyDown={handleResultsKeyDown}
            id="search-modal-title"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 hidden sm:flex items-center">
            <span className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 mr-1">↑↓</span>
            <span>to navigate</span>
            <span className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 mx-1">↵</span>
            <span>to select</span>
            <span className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 mx-1">Esc</span>
            <span>to close</span>
          </div>
        </div>
        
        <div 
          ref={resultsRef}
          className="flex-1 overflow-y-auto p-2"
        >
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result, index) => (
                <button 
                  key={result.path}
                  data-index={index}
                  type="button"
                  className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer ${
                    selectedIndex === index ? "bg-gray-100 dark:bg-gray-700" : ""
                  }`}
                  onClick={() => navigateToArticle(result.path)}
                  aria-selected={selectedIndex === index}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{result.title}</div>
                  {result.snippet && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {result.snippet}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Start typing to search articles</p>
              <p className="text-xs mt-2">Search is performed on article titles and metadata only</p>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
} 