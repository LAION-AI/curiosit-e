# API Documentation

This document describes the API endpoints available in the `routes/api` directory.

## 1. audio-button.ts

- **Path:** `/api/audio-button`
- **Description:** Serves the `audio-button.min.js` script, potentially with Brotli compression.
- **HTTP Method:** GET
- **Response Format:** `application/javascript`

### GET

- **Description:** Returns the `audio-button.min.js` script. If the client supports Brotli, it returns the Brotli compressed version.
- **Headers:**
    - `Content-Type`: `application/javascript`
    - `Cache-Control`: `public, max-age=3600`
    - `Content-Encoding`: `br` (if Brotli compression is used)

## 2. bildungsplan.ts

- **Path:** `/api/bildungsplan`
- **Description:**  Provides access to the Bildungsplan API for querying educational content.
- **HTTP Methods:** GET, POST
- **Request Format:** `application/json`
- **Response Format:** `application/json`

### GET

- **Description:** Queries the Bildungsplan API with a text query.
- **Query Parameters:**
    - `query`: The text query to search for (required).
    - `top_n`: The number of top results to return (optional, default: 5).
- **Response Body:**
    - `BildungsplanResponse` in JSON format.
    - On error, returns a JSON with an `error` field and a 500 status code.

### POST

- **Description:** Queries the Bildungsplan API with a JSON payload.
- **Request Body:**
    ```json
    {
      "query": "your search query",
      "top_n": 5 // optional
    }
    ```
    - `query`: The text query to search for (required).
    - `top_n`: The number of top results to return (optional, default: 5).
- **Response Body:**
    - `BildungsplanResponse` in JSON format.
    - On error, returns a JSON with an `error` field and a 500 status code.

## 3. chat.ts

- **Path:** `/api/chat`
- **Description:**  Handles chat interactions, including streaming responses from a language model.
- **HTTP Method:** POST
- **Request Format:** `application/json`
- **Response Format:** `text/event-stream`

### POST

- **Description:** Sends chat messages to the language model and streams back the response as Server-Sent Events.
- **Request Body:**
    ```json
    {
      "messages": [
        { "role": "user", "content": "Hello" },
        { "role": "assistant", "content": "Hi there!" }
      ],
      "lang": "en", // Language code
      "universalApiKey": "...", // API key
      "llmApiUrl": "...",     // LLM API URL (optional, overrides env var)
      "llmApiKey": "...",    // LLM API Key (optional, overrides env var)
      "llmApiModel": "...",   // LLM API Model (optional, overrides env var)
      "systemPrompt": "...",  // System prompt (optional, overrides default)
      "vlmApiUrl": "...",     // VLM API URL (optional, overrides env var)
      "vlmApiKey": "...",    // VLM API Key (optional, overrides env var)
      "vlmApiModel": "...",   // VLM API Model (optional, overrides env var)
      "vlmCorrectionModel": "..." // VLM Correction Model (optional, overrides env var)
    }
    ```
    - `messages`: Array of chat messages.
    - `lang`: Language code for content and prompts.
    - `universalApiKey`: API key for authentication.
    - Optional API URL, Key, and Model parameters to override environment variables for LLM and VLM.
    - `systemPrompt`: Optional system prompt to override default prompt.
- **Response Body:**
    - Server-Sent Events stream (`text/event-stream`).
    - Events:
        - `message`: Regular chat text content.
        - `error`: Error message if PDF conversion fails.

## 4. game.ts

- **Path:** `/api/game`
- **Description:**  Manages saved game states, allowing for saving, updating, retrieving, and deleting game data.
- **HTTP Methods:** PUT, POST, GET, DELETE
- **Request Format:** `application/json`
- **Response Format:** `application/json`

### PUT

- **Description:** Updates an existing saved game.
- **Request Body:**
    ```json
    {
      "id": "game-uuid", // Required game ID
      "code": "new game code", // Optional, new game code
      "points": 10 // Optional, points to add
    }
    ```
    - `id`:  ID of the game to update (required).
    - `code`: New game code (optional).
    - `points`: Points to add to the total score (optional).
- **Response Body:**
    - On success (200):
        ```json
        {
          "success": true,
          "game": { ... } // Updated game object
        }
        ```
    - On error (400, 404, 500):
        ```json
        {
          "success": false,
          "error": "Error message"
        }
        ```

### POST

- **Description:** Creates a new saved game.
- **Request Body:**
    ```json
    {
      "code": "game code", // Required game code
      "name": "game name", // Required game name
      "points": 0 // Optional initial points
    }
    ```
    - `code`: Game code (required).
    - `name`: Game name (required).
    - `points`: Initial points (optional, default: 0).
- **Response Body:**
    - On success (200):
        ```json
        {
          "success": true,
          "game": { ... } // New game object
        }
        ```
    - On error (400, 500):
        ```json
        {
          "success": false,
          "error": "Error message"
        }
        ```

### GET

- **Description:** Retrieves a list of all saved games.
- **Response Body:**
    - On success (200):
        ```json
        [
          { ... }, // Game object 1
          { ... }  // Game object 2
        ]
        ```
    - On error (500):
        ```json
        {
          "success": false,
          "error": "Error message"
        }
        ```

### DELETE

- **Description:** Deletes a saved game by ID.
- **Query Parameters:**
    - `id`: Game ID to delete (required).
- **Response Body:**
    - On success (200):
        ```json
        { "success": true }
        ```
    - On error (400, 500):
        ```json
        {
          "success": false,
          "error": "Error message"
        }
        ```

## 5. papers.ts

- **Path:** `/api/papers`
- **Description:**  Provides access to the papers API (ORKG) for searching scientific papers.
- **HTTP Methods:** GET, POST
- **Request Format:** `application/json`
- **Response Format:** `application/json`

### GET

- **Description:** Searches for papers using a text query.
- **Query Parameters:**
    - `query`: Text query to search for (required).
    - `limit`: Maximum number of results (optional, default: 5).
- **Response Body:**
    - Papers API response in JSON format.
    - On error, returns a JSON with an `error` field and a 500 status code.

### POST

- **Description:** Searches for papers using a JSON payload.
- **Request Body:**
    ```json
    {
      "query": "search query", // Required
      "limit": 5 // Optional, maximum results
    }
    ```
    - `query`: Text query to search for (required).
    - `limit`: Maximum number of results (optional, default: 5).
- **Response Body:**
    - Papers API response in JSON format.
    - On error, returns a JSON with an `error` field and a 500 status code.

## 6. stt.ts

- **Path:** `/api/stt`
- **Description:**  Handles speech-to-text (STT) functionality.
- **HTTP Method:** POST
- **Request Format:** `multipart/form-data`
- **Response Format:** `text/plain`

### POST

- **Description:** Transcribes audio from an uploaded file.
- **Request Body:** `multipart/form-data`
    - `audio`: Audio file to transcribe (required).
    - `sttUrl`: STT API URL (optional, overrides env var).
    - `sttKey`: STT API Key (optional, overrides env var).
    - `sttModel`: STT API Model (optional, overrides env var).
- **Response Body:**
    - On success (200): Transcription text (`text/plain`).
    - On error (400, 500): Error message.

## 7. tts.ts

- **Path:** `/api/tts`
- **Description:**  Handles text-to-speech (TTS) functionality.
- **HTTP Method:** POST
- **Request Format:** `application/json`
- **Response Format:** `audio/mp3`

### POST

- **Description:** Synthesizes speech from text.
- **Request Body:**
    ```json
    {
      "text": "Text to synthesize", // Required text
      "textPosition": "...", // Text position (optional, for logging?)
      "ttsUrl": "...",     // TTS API URL (optional, overrides env var)
      "ttsKey": "...",    // TTS API Key (optional, overrides env var)
      "ttsModel": "..."   // TTS API Model (optional, overrides env var)
    }
    ```
    - `text`: Text to synthesize (required).
    - `textPosition`: Text position (optional).
    - Optional API URL, Key, and Model parameters to override environment variables.
- **Response Body:**
    - On success (200): Audio data in MP3 format (`audio/mp3`).
    - On error (400, 500): Error message.

## 8. wikipedia.ts

- **Path:** `/api/wikipedia`
- **Description:**  Provides access to a Wikipedia search API.
- **HTTP Methods:** GET, POST
- **Request Format:** `application/json`
- **Response Format:** `application/json`

### GET

- **Description:** Searches Wikipedia using a text query.
- **Query Parameters:**
    - `text`: Text query (required).
    - `collection`: Wikipedia collection to search (optional, default: "English-ConcatX-Abstract").
    - `n`: Number of results (optional, default: 2).
- **Response Body:**
    - Wikipedia API response in JSON format.
    - On error, returns a JSON with an `error` field and a 500 status code.

### POST

- **Description:** Searches Wikipedia using a JSON payload.
- **Request Body:**
    ```json
    {
      "text": "search text", // Required
      "collection": "English-ConcatX-Abstract", // Optional
      "n": 2 // Optional, number of results
    }
    ```
    - `text`: Text query (required).
    - `collection`: Wikipedia collection (optional, default: "English-ConcatX-Abstract").
    - `n`: Number of results (optional, default: 2).
- **Response Body:**
    - Wikipedia API response in JSON format.
    - On error, returns a JSON with an `error` field and a 500 status code.
