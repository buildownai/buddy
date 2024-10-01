# Configuration Schema

This document outlines the configuration options available for the application. All configuration values can be adjusted as needed, with sensible defaults provided.

You can also have a look into the implementation at `/packages/backend/src/config.ts`

## Configuration Fields

### `port`

- **Type:** `number`
- **Default:** `3000`
- **Description:** Port number for the server to listen on.
- **Constraints:** Must be an integer and positive.

### `environment`

- **Type:** `enum` (`development`, `production`)
- **Default:** `development`
- **Description:** Specifies the current environment (development or production).

### `apiBasePath`

- **Type:** `string`
- **Default:** `/api`
- **Description:** Base path for API routes.

### `corsOrigin`

- **Type:** `string`
- **Default:** `*`
- **Description:** Allowed origins for Cross-Origin Resource Sharing (CORS).

### `tempDir`

- **Type:** `string`
- **Default:** `${os.tmpdir()}/pilot-repos`
- **Description:** Temporary directory for storing cloned repositories.

### `logLevel`

- **Type:** `string`
- **Default:** `info`
- **Description:** Logging level (e.g., `info`, `debug`, `error`).

### `surrealdb`

- **Type:** `object`
- **Description:** SurrealDB connection configuration.

  - **`url`:**
    - **Type:** `string`
    - **Default:** `ws://127.0.0.1:8000`
    - **Description:** URL for connecting to the SurrealDB WebSocket endpoint.

  - **`user`:**
    - **Type:** `string`
    - **Default:** `root`
    - **Description:** Username for SurrealDB.

  - **`pass`:**
    - **Type:** `string`
    - **Default:** `root`
    - **Description:** Password for SurrealDB.

  - **`database`:**
    - **Type:** `string`
    - **Default:** `pilot`
    - **Description:** Name of the database to use in SurrealDB.

  - **`namespace`:**
    - **Type:** `string`
    - **Default:** `pilot`
    - **Description:** Namespace to use in SurrealDB.

### `llm`

- **Type:** `object`
- **Description:** Configuration for Large Language Model (LLM) services.

  - **`url`:**
    - **Type:** `string`
    - **Default:** `http://127.0.0.1:11434`
    - **Description:** URL for the LLM API service.

  - **`models`:**
    - **Type:** `object`
    - **Description:** LLM models used for various tasks.

    - **`chat`:**
      - **Type:** `string`
      - **Default:** `qwen2.5-coder:latest`
      - **Description:** Default model for chat-based LLM tasks.

    - **`small`:**
      - **Type:** `string`
      - **Default:** `llama3.2:1b`
      - **Description:** Default small model for basic tasks.

    - **`code`:**
      - **Type:** `string`
      - **Default:** `qwen2.5-coder:latest`
      - **Description:** Model used for code generation.

    - **`html`:**
      - **Type:** `string`
      - **Default:** `reader-lm:1.5b`
      - **Description:** Model used for converting HTML to markdown for LLM usage.

    - **`embeddings`:**
      - **Type:** `string`
      - **Default:** `nomic-embed-text:latest`
      - **Description:** Model used for embedding text in vector space for retrieval-augmented generation.

### `jwtSecret`

- **Type:** `string`
- **Default:** `your-secret-key-must-be-at-least-32-chars`
- **Description:** Secret key used for signing JSON Web Tokens (JWT). Must be at least 32 characters long.

### `jwtAlgorithm`

- **Type:** `enum` (`HS256`, `HS384`, `HS512`)
- **Default:** `HS256`
- **Description:** Algorithm to use for signing JWTs.
