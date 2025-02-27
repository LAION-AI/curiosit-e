package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
)

// Use environment variable for static directory path with a default fallback
var staticDir = getStaticDir()

// Maximum number of bytes to read from the beginning of a file
const maxReadSize = 8192 // 8KB should be enough for metadata and title

// getStaticDir returns the static directory path from environment variable or default
func getStaticDir() string {
	if dir := os.Getenv("STATIC_DIR"); dir != "" {
		return dir
	}
	return "/app/static/articles" // Default path for Docker
}

// enableCors enables CORS for all routes
func enableCors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// SearchResult represents a search result item
type SearchResult struct {
	Title   string `json:"title"`
	Path    string `json:"path"`
	Snippet string `json:"snippet,omitempty"`
}

func main() {
	fmt.Printf("Using static directory: %s\n", staticDir)

	// Find one of the .html files in the static directory to serve as an example
	exampleHTMLFile, err := findExampleHTML(staticDir)
	if err != nil {
		fmt.Println("Error finding example HTML file:", err)
		os.Exit(1)
		return
	}

	fmt.Printf("Found example HTML file: %s\n", exampleHTMLFile)

	// Create a new router
	mux := http.NewServeMux()

	// Register routes
	mux.HandleFunc("/related", relatedFilesHandler)
	mux.HandleFunc("/search", searchHandler)

	// Wrap the router with CORS middleware
	handler := enableCors(mux)

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Default port
	}
	fmt.Printf("Starting server on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		fmt.Println("Error starting server:", err)
		os.Exit(1)
	}
}

// findExampleHTML finds an example HTML file in the static directory
func findExampleHTML(staticDir string) (string, error) {
	var exampleFile string
	err := filepath.Walk(staticDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(path, ".html") {
			exampleFile = path
			return filepath.SkipAll
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	if exampleFile == "" {
		return "", fmt.Errorf("no HTML files found in %s", staticDir)
	}
	return exampleFile, nil
}

// relatedFilesHandler handles requests for related files
func relatedFilesHandler(w http.ResponseWriter, r *http.Request) {
	title := r.URL.Query().Get("title")
	if title == "" {
		http.Error(w, "Missing title parameter", http.StatusBadRequest)
		return
	}

	// Search for related files
	relatedFiles := searchRelatedFiles(title, staticDir)

	// Return the results as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(relatedFiles)
}

// searchHandler handles search requests
func searchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query parameter", http.StatusBadRequest)
		return
	}

	// Search for files matching the query
	results := searchFiles(query, staticDir)

	// Return the results as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// searchFiles searches for files matching the query
func searchFiles(query string, searchDir string) []SearchResult {
	var results []SearchResult
	var mutex sync.Mutex
	var wg sync.WaitGroup

	// Convert query to lowercase for case-insensitive search
	queryLower := strings.ToLower(query)

	// Regex to clean up paths
	searchResultsRegex := regexp.MustCompile(`search_results_\d{8}_\d{6}/`)

	// Walk through all files in the directory
	err := filepath.Walk(searchDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Only process HTML files
		if !strings.HasSuffix(path, ".html") {
			return nil
		}

		wg.Add(1)
		go func(filePath string) {
			defer wg.Done()

			// Extract the relative path for the result
			relPath, _ := filepath.Rel(searchDir, filePath)
			relPath = strings.TrimSuffix(relPath, ".html")

			// Clean up the path by removing search_results prefix
			cleanPath := searchResultsRegex.ReplaceAllString(relPath, "")

			// Format the title from the path
			title := formatTitle(relPath)

			// Check if the title or path matches the query
			titleLower := strings.ToLower(title)
			pathLower := strings.ToLower(cleanPath)

			if strings.Contains(titleLower, queryLower) || strings.Contains(pathLower, queryLower) {
				// If the title or path matches, add it to results
				result := SearchResult{
					Title: title,
					Path:  cleanPath,
				}

				// Try to extract a snippet from the file metadata
				snippet, _ := extractMetadataSnippet(filePath, queryLower)
				if snippet != "" {
					result.Snippet = snippet
				}

				mutex.Lock()
				results = append(results, result)
				mutex.Unlock()
				return
			}

			// If title/path doesn't match, check file metadata
			snippet, found := extractMetadataSnippet(filePath, queryLower)
			if found {
				result := SearchResult{
					Title:   title,
					Path:    cleanPath,
					Snippet: snippet,
				}

				mutex.Lock()
				results = append(results, result)
				mutex.Unlock()
			}
		}(path)

		return nil
	})

	if err != nil {
		fmt.Printf("Error walking directory: %v\n", err)
		return results
	}

	wg.Wait()
	return results
}

// extractMetadataSnippet extracts a snippet from the file metadata
// Only reads the beginning of the file to avoid issues with large files
func extractMetadataSnippet(filePath string, queryLower string) (string, bool) {
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Printf("Error opening file %s: %v\n", filePath, err)
		return "", false
	}
	defer file.Close()

	// Only read the beginning of the file (metadata section)
	buffer := make([]byte, maxReadSize)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		fmt.Printf("Error reading file %s: %v\n", filePath, err)
		return "", false
	}

	// Convert to string and limit to what was actually read
	content := string(buffer[:n])

	// Extract title from metadata
	titleMatch := regexp.MustCompile(`<title[^>]*>(.*?)</title>`).FindStringSubmatch(content)
	metaDescMatch := regexp.MustCompile(`<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>`).FindStringSubmatch(content)

	var titleText, metaDesc string
	if len(titleMatch) > 1 {
		titleText = titleMatch[1]
	}
	if len(metaDescMatch) > 1 {
		metaDesc = metaDescMatch[1]
	}

	// Check if query is in title or meta description
	titleFound := strings.Contains(strings.ToLower(titleText), queryLower)
	metaFound := strings.Contains(strings.ToLower(metaDesc), queryLower)

	if titleFound || metaFound {
		// Construct snippet from title and meta description
		var snippetParts []string
		if titleFound && titleText != "" {
			snippetParts = append(snippetParts, titleText)
		}
		if metaFound && metaDesc != "" {
			snippetParts = append(snippetParts, metaDesc)
		}

		snippet := strings.Join(snippetParts, " - ")
		if snippet == "" {
			// If no specific matches, use the first paragraph
			paragraphs := regexp.MustCompile(`<p[^>]*>(.*?)</p>`).FindAllStringSubmatch(content, 1)
			if len(paragraphs) > 0 && len(paragraphs[0]) > 1 {
				// Remove HTML tags for cleaner snippet
				cleanParagraph := regexp.MustCompile(`<[^>]*>`).ReplaceAllString(paragraphs[0][1], "")
				snippet = cleanParagraph
			}
		}

		// Truncate long snippets
		if len(snippet) > 200 {
			snippet = snippet[:197] + "..."
		}

		return snippet, true
	}

	// Check for any content match in the header section
	headerMatch := regexp.MustCompile(`<head[^>]*>(.*?)</head>`).FindStringSubmatch(content)
	if len(headerMatch) > 1 {
		headerContent := headerMatch[1]
		if strings.Contains(strings.ToLower(headerContent), queryLower) {
			// Extract a snippet from the first paragraph
			paragraphs := regexp.MustCompile(`<p[^>]*>(.*?)</p>`).FindAllStringSubmatch(content, 1)
			if len(paragraphs) > 0 && len(paragraphs[0]) > 1 {
				// Remove HTML tags for cleaner snippet
				cleanParagraph := regexp.MustCompile(`<[^>]*>`).ReplaceAllString(paragraphs[0][1], "")
				snippet := cleanParagraph

				// Truncate long snippets
				if len(snippet) > 200 {
					snippet = snippet[:197] + "..."
				}

				return snippet, true
			}
			return "Found in document metadata", true
		}
	}

	return "", false
}

// formatTitle formats a file path into a readable title
func formatTitle(path string) string {
	// Remove search_results prefix with date/time if present
	searchResultsRegex := regexp.MustCompile(`search_results_\d{8}_\d{6}/`)
	path = searchResultsRegex.ReplaceAllString(path, "")

	// Replace underscores and hyphens with spaces
	title := strings.ReplaceAll(path, "_", " ")
	title = strings.ReplaceAll(title, "-", " ")

	// Capitalize words
	words := strings.Fields(title)
	for i, word := range words {
		if len(word) > 0 {
			words[i] = strings.ToUpper(word[:1]) + word[1:]
		}
	}

	return strings.Join(words, " ")
}

// RelatedFile represents a related file
type RelatedFile struct {
	Img  string `json:"img"`
	Path string `json:"path"`
}

// searchRelatedFiles searches for related files based on the title
func searchRelatedFiles(title string, searchDir string) []RelatedFile {
	var relatedFiles []RelatedFile

	// Walk through all files in the directory
	filepath.Walk(searchDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories and non-HTML files
		if info.IsDir() || !strings.HasSuffix(path, ".html") {
			return nil
		}

		// Format the file info
		relatedFile := formatRelatedFileInfo(path)
		relatedFiles = append(relatedFiles, relatedFile)

		return nil
	})

	// Limit to 5 related files
	if len(relatedFiles) > 5 {
		relatedFiles = relatedFiles[:5]
	}

	return relatedFiles
}

// formatRelatedFileInfo formats a file path into a related file info
func formatRelatedFileInfo(path string) RelatedFile {
	// Extract the relative path
	relPath, _ := filepath.Rel(staticDir, path)
	relPath = strings.TrimSuffix(relPath, ".html")

	// Remove search_results prefix with date/time if present
	searchResultsRegex := regexp.MustCompile(`search_results_\d{8}_\d{6}/`)
	cleanPath := searchResultsRegex.ReplaceAllString(relPath, "")

	// For now, use a placeholder image
	img := "/placeholder.jpg"

	return RelatedFile{
		Img:  img,
		Path: cleanPath,
	}
}
