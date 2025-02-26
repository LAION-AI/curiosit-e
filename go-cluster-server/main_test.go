package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func TestSearchRelatedFiles(t *testing.T) {
	// Create a temporary directory for test files
	tempDir, err := os.MkdirTemp("", "test-files")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create some test files
	testFiles := []string{
		"test_article.html",
		"test_article_related.html",
		"another_article.html",
		"unrelated.html",
	}

	for _, filename := range testFiles {
		path := filepath.Join(tempDir, filename)
		if err := os.WriteFile(path, []byte("test content"), 0644); err != nil {
			t.Fatalf("Failed to create test file %s: %v", filename, err)
		}
	}

	// Test cases
	tests := []struct {
		title    string
		expected int // number of expected matches
	}{
		{"test", 2},        // Should match test_article and test_article_related
		{"article", 3},     // Should match all articles
		{"unrelated", 1},   // Should match only unrelated.html
		{"nonexistent", 0}, // Should match nothing
	}

	for _, tc := range tests {
		t.Run(tc.title, func(t *testing.T) {
			results := searchRelatedFiles(tc.title, tempDir)
			if len(results) != tc.expected {
				t.Errorf("searchRelatedFiles(%q) returned %d results, expected %d",
					tc.title, len(results), tc.expected)
			}
		})
	}
}

func TestSearchRelatedFilesWithOriginalFiles(t *testing.T) {
	searchDir := "/Users/michael/Software/opensource/school-bud-e-frontend/static/articles"
	files := searchRelatedFiles("Developing_skills", searchDir)
	marshalled, _ := json.MarshalIndent(files, "", "\t")

	fmt.Println(string(marshalled))
}
