package main

import (
	"fmt"
	"testing"
)

func TestGenerateKLUs(t *testing.T) {
	path := "../static/articles/search_results_20241022_214351/report_Defining_post-normal_science_and_its_relevance_to_modern_society.html"
	klus := generateKLUs(path, 200)
	// Use t.Logf instead of t.Log for proper formatting
	t.Logf("Number of KLUs generated: %s", (klus))
	// Also print to stdout so it's visible during normal test runs
	fmt.Printf("Number of KLUs generated: %d\n", len(klus))
	if len(klus) == 0 {
		t.Errorf("Expected klus to exist, got %s", klus)
	}
}
