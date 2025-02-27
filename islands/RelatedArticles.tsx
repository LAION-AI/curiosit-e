type Article = {
    title: string;
    path: string;
    img: string;
};

export default function RelatedArticles({relatedArticles: articles, ...params}: { count: number, offset?: number, size?: 'large' | 'small', relatedArticles: Article[] }) {
    if (articles.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <a className="block" href="/articles">
                    <div className="relative overflow-hidden">
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </div>
                    <div className="p-5">
                        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
                        <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
                        <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                </a>
            </div>
        );
    }

    let from = 0;
    let to = params.count;

    if (params.offset) {
        from = params.offset;
        to = params.offset + params.count;
    }

    return (
        <>
            {articles.slice(from, to).map((article) => {
                // Format the article path correctly and encode it for URL safety
                const articlePath = encodeURIComponent(article.path);
                
                return (
                    <div key={article.path} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-4px]">
                        <a className="block" href={`/articles/${articlePath}`}>
                            <div className="relative overflow-hidden">
                                <div className={`${params.size === "small" ? "aspect-square" : "aspect-video"} bg-gray-200 dark:bg-gray-700`}>
                                    <img
                                        alt="Article thumbnail"
                                        src={article.img || "/placeholder-image.jpg"}
                                        className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center mb-2">
                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                        Educational
                                    </span>
                                </div>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {article.title}
                                </h2>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" role="img" aria-label="Book icon">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        Read article
                                    </span>
                                </div>
                            </div>
                        </a>
                    </div>
                );
            })}
        </>
    );
} 