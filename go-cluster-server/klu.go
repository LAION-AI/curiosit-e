package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func generateKLUs(path string, tokensPerChunk int) []string {
	charactersPerChunk := tokensPerChunk * 4
	content := string(readFile(path))

	klus := []string{}
	maxIterations := 20
	currentIteration := 0

	for i := 1500; i < (len(content) - (200 * 4)); {
		to := i + charactersPerChunk

		var chunk string
		if to > len(content) {
			chunk = content[i:]
		} else {
			chunk = content[i:to]
		}
		klus = append(klus, formatLMResponseToKLU(chunk))

		i = to

		if currentIteration >= maxIterations {
			break
		}

		currentIteration++
	}
	return klus
}

func readFile(path string) []byte {
	content, err := os.ReadFile(path)
	if err != nil {
		fmt.Print(err.Error())
	}

	return content
}

func formatLMResponseToKLU(chunk string) string {
	prompt := `Reply in this format, avoid copying the original wording:
	{ 
		"context": "create a short summary",
		"Earth-Moon System": {
			"relations": {
				"evolution described by": "Dark Matter Field Fluid Model",
				"current behavior agrees with": "Dark Matter Field Fluid Model",
				"evolution pattern agrees with": ["Geological Evidence", "Fossil Evidence"]
			},
			"attributes": {
				"closest distance 4.5 billion years ago": "259000 km",
				"distance relative to Roche limit": "Far beyond"
			}
		},
		"Dark Matter Field Fluid Model": {
			"relations": {
				"proposed at": "Meeting of Division of Particle and Field 2004, American Physical Society",
				"describes evolution of": "Earth-Moon System",
				"predicts slowing rotation of": "Mars"
			},
			...
		}
	}` + chunk
	return getLMResponse(prompt)
}

func getLMResponse(prompt string) string {
	fmt.Println("Let's send the request!")

	// Build a payload map
	payload := map[string]any{"prompt": prompt, "model": "llama3.2", "stream": false}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("Error marshalling JSON:", err)
		return ""
	}

	resp, err := http.Post("http://localhost:11434/api/generate", "application/json", bytes.NewReader(payloadBytes))
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		fmt.Println("Error unmarshalling response:", err)
		return ""
	}

	if response, ok := data["response"]; ok {
		fmt.Println(response.(string))
	}

	return string(body)
}
