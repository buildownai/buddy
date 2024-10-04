# BuildOwn.AI Pilot - Configuration Guide

The **BuildOwn.AI Pilot** application is configured using environment variables, which can be set in the system or using a `.env` file. This guide provides details on all available configuration options, including how to set them up.

## Using an `.env` File

The easiest way to configure the application is by creating a `.env` file in the root of your project. This file allows you to set environment variables that will be loaded automatically when the application starts.

### Example `.env` File

```bash
PORT=3000
NODE_ENV=development
API_BASE_PATH=/api
CORS_ORIGIN=*
TEMP_DIR=/path/to/tempdir
LOG_LEVEL=info

# SurrealDB configuration
SURREAL_DB_URL=ws://127.0.0.1:8000
SURREAL_DB_USER=root
SURREAL_DB_PASS=root
SURREAL_DB_DATABASE=pilot
SURREAL_DB_NAMESPACE=pilot

# LLM configuration
LLM_URL=http://127.0.0.1:11434
LLM_MODEL_CHAT=qwen2.5-coder:latest
LLM_MODEL_SMALL=llama3.2:1b
LLM_MODEL_CODE=qwen2.5-coder:latest
LLM_MODEL_HTML=reader-lm:1.5b
LLM_MODEL_EMBEDDINGS=nomic-embed-text:latest

# JWT configuration
JWT_SECRET=your-secret-key-must-be-at-least-32-chars
JWT_ALGORITHM=HS256
```

### How to Set Up

1. Create a file named `.env` in the root directory of your project.
2. Copy and paste the example content above.
3. Replace the values with your own configuration if necessary.

## Configuration Options

Below is a list of all the available configuration options for **BuildOwn.AI Pilot**.

### General Configuration

- **`PORT`**
  - **Description:** The port number for the server to listen on.
  - **Type:** `number`
  - **Default:** `3000`
  - **Example:** `PORT=4000`

- **`NODE_ENV`**
  - **Description:** The environment in which the application is running (`development` or `production`).
  - **Type:** `enum: development | production`
  - **Default:** `development`
  - **Example:** `NODE_ENV=production`

- **`API_BASE_PATH`**
  - **Description:** The base path for all API routes.
  - **Type:** `string`
  - **Default:** `/api`
  - **Example:** `API_BASE_PATH=/v1/api`

- **`CORS_ORIGIN`**
  - **Description:** The allowed origins for CORS requests.
  - **Type:** `string`
  - **Default:** `*`
  - **Example:** `CORS_ORIGIN=https://example.com`

- **`TEMP_DIR`**
  - **Description:** The directory used to store temporary cloned repositories.
  - **Type:** `string`
  - **Default:** System's temporary directory (`/tmp/pilot-repos` on Linux/MacOS, etc.)
  - **Example:** `TEMP_DIR=/var/tmp/pilot-repos`

- **`LOG_LEVEL`**
  - **Description:** The logging level (`info`, `debug`, `error`).
  - **Type:** `string`
  - **Default:** `info`
  - **Example:** `LOG_LEVEL=debug`

### SurrealDB Configuration

- **`SURREAL_DB_URL`**
  - **Description:** The WebSocket URL for connecting to the SurrealDB instance.
  - **Type:** `string (URL)`
  - **Default:** `ws://127.0.0.1:8000`
  - **Example:** `SURREAL_DB_URL=ws://db.example.com:8000`

- **`SURREAL_DB_USER`**
  - **Description:** The username for authenticating with SurrealDB.
  - **Type:** `string`
  - **Default:** `root`
  - **Example:** `SURREAL_DB_USER=myuser`

- **`SURREAL_DB_PASS`**
  - **Description:** The password for authenticating with SurrealDB.
  - **Type:** `string`
  - **Default:** `root`
  - **Example:** `SURREAL_DB_PASS=mypassword`

- **`SURREAL_DB_DATABASE`**
  - **Description:** The name of the SurrealDB database to use.
  - **Type:** `string`
  - **Default:** `pilot`
  - **Example:** `SURREAL_DB_DATABASE=mydatabase`

- **`SURREAL_DB_NAMESPACE`**
  - **Description:** The namespace in SurrealDB to use.
  - **Type:** `string`
  - **Default:** `pilot`
  - **Example:** `SURREAL_DB_NAMESPACE=mynamespace`

### LLM (Large Language Model) Configuration

- **`LLM_URL`**
  - **Description:** The URL for the LLM (large language model) API.
  - **Type:** `string (URL)`
  - **Default:** `http://127.0.0.1:11434`
  - **Example:** `LLM_URL=http://llm.example.com:11434`

- **LLM Models:**
  - **`LLM_MODEL_CHAT`**
    - **Description:** The model used for chat-based tasks.
    - **Type:** `string`
    - **Default:** `qwen2.5-coder:latest`
    - **Example:** `LLM_MODEL_CHAT=gpt-3.5-turbo`

  - **`LLM_MODEL_SMALL`**
    - **Description:** The model used for smaller, lightweight tasks.
    - **Type:** `string`
    - **Default:** `qwen2.5-coder:latest`
    - **Example:** `LLM_MODEL_SMALL=small-llm`

  - **`LLM_MODEL_CODE`**
    - **Description:** The model used for code generation.
    - **Type:** `string`
    - **Default:** `qwen2.5-coder:latest`
    - **Example:** `LLM_MODEL_CODE=gpt-coder`

  - **`LLM_MODEL_HTML`**
    - **Description:** The model used for converting HTML to markdown for LLM use.
    - **Type:** `string`
    - **Default:** `reader-lm:1.5b`
    - **Example:** `LLM_MODEL_HTML=html-to-markdown-model`

  - **`LLM_MODEL_EMBEDDINGS`**
    - **Description:** The model used for embedding text in vector space for retrieval.
    - **Type:** `string`
    - **Default:** `nomic-embed-text:latest`
    - **Example:** `LLM_MODEL_EMBEDDINGS=text-embedder`

### JWT (JSON Web Token) Configuration

- **`JWT_SECRET`**
  - **Description:** The secret key used for signing JWTs (must be at least 32 characters long).
  - **Type:** `string`
  - **Default:** `your-secret-key-must-be-at-least-32-chars`
  - **Example:** `JWT_SECRET=supersecretkey12345678901234567890`

- **`JWT_ALGORITHM`**
  - **Description:** The algorithm to use for signing JWTs.
  - **Type:** `enum: HS256 | HS384 | HS512`
  - **Default:** `HS256`
  - **Example:** `JWT_ALGORITHM=HS512`
