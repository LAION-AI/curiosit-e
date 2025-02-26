package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// Use environment variable for static directory path with a default fallback
var staticDir = getStaticDir()

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

func main() {
	fmt.Printf("Using static directory: %s\n", staticDir)

	// Find one of the .html files in the static directory to serve as an example
	exampleHTMLFile, err := findExampleHTML(staticDir)
	if err != nil {
		fmt.Println("Error finding example HTML file:", err)
		os.Exit(1)
		return
	}

	// Serve static files with CORS
	fs := http.FileServer(http.Dir(staticDir))
	http.Handle("/static/", enableCors(http.StripPrefix("/static/", fs)))

	// Route for related files with CORS
	http.Handle("/related-files", enableCors(http.HandlerFunc(relatedFilesHandler)))

	// Example route to serve an HTML file with CORS
	http.Handle("/", enableCors(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "/index.html" { // Serve index.html for root or /index.html
			http.ServeFile(w, r, exampleHTMLFile)
			return
		}
		// For other paths, try to serve static files, if not found, return 404
		fs.ServeHTTP(w, r)
	})))

	fmt.Println("Server listening on localhost:3003")
	err = http.ListenAndServe(":3003", nil)
	if err != nil {
		fmt.Println("Error starting server:", err)
		os.Exit(1)
	}
}

// findExampleHTML finds the first .html file in the static directory for serving as example.
func findExampleHTML(staticDir string) (string, error) {
	var exampleHTMLFile string
	err := filepath.Walk(staticDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".html") {
			exampleHTMLFile = path
			return filepath.SkipDir // Stop walking after finding the first HTML file
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	if exampleHTMLFile == "" {
		return "", fmt.Errorf("no HTML file found in static directory: %s", staticDir)
	}
	return exampleHTMLFile, nil
}

// relatedFilesHandler handles the /related-files route.
func relatedFilesHandler(w http.ResponseWriter, r *http.Request) {
	// Extract the title from the query parameters
	title := r.URL.Query().Get("title")
	if title == "" {
		http.Error(w, "Title parameter is missing", http.StatusBadRequest)
		return
	}

	// Search for related files
	relatedFiles := searchRelatedFiles(title, staticDir)

	// Send the related files back to the client as JSON
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	if err := enc.Encode(relatedFiles); err != nil {
		fmt.Println("Error encoding related files to JSON:", err)
		http.Error(w, "Failed to encode related files", http.StatusInternalServerError)
		return
	}
}

type RelatedFile struct {
	Img  string `json:"img"`
	Path string `json:"path"`
}

// searchRelatedFiles searches for files related to the given title in the specified directory.
func searchRelatedFiles(title string, searchDir string) []RelatedFile {
	var relatedFiles []RelatedFile
	filepath.Walk(searchDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			// Basic check: if the filename contains the title (you can implement more sophisticated logic here)
			if strings.Contains(strings.ToLower(info.Name()), strings.ToLower(title)) {
				relatedFiles = append(relatedFiles, formatRelatedFileInfo(path))
			}
		}
		return nil
	})
	return relatedFiles
}

func formatRelatedFileInfo(path string) RelatedFile {
	file, err := os.Open(path)
	if err != nil {
		return RelatedFile{Path: path} // Return empty struct if file can't be opened
	}
	defer file.Close()

	byteContent, err := io.ReadAll(file)
	if err != nil {
		return RelatedFile{Path: path} // Return empty struct if reading fails
	}

	stringContent := string(byteContent)

	imgStartTag := "<img src=\""
	index := strings.Index(stringContent, imgStartTag)
	if index == -1 {
		return RelatedFile{Path: path} // Return empty struct if img not found
	}

	img := stringContent[index+len(imgStartTag):]

	closingQuoteIndex := strings.Index(img, "\"")

	img = img[:closingQuoteIndex]

	return RelatedFile{Path: path, Img: img}
}
