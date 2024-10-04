# BuildOwn.AI Pilot

**BuildOwn.AI Pilot** is a demonstration application showcasing how to build an AI-driven solution in TypeScript, leveraging **Ollama** for serving large language models. This project highlights modern development practices and AI integration with tools like **SurrealDB** and **Bun**.

## Installation

### Requirements

To get started, you'll need to have the following tools installed:

- [Bun](https://bun.sh) - A fast JavaScript runtime.
- [Ollama](https://ollama.com) - A service for running large language models.
- [Docker](https://www.docker.com) - Required for running SurrealDB.
- [SurrealDB](https://surrealdb.com) - A scalable, graph-relational database.
- A modern browser to interact with the frontend.

### Install Dependencies

To install the necessary project dependencies, run:

```bash
bun install
```

## Running the Pilot

### Preparation

Before starting **BuildOwn.AI Pilot**, ensure you have a running instance of **SurrealDB**. The easiest way to do this is by using the official **SurrealDB** Docker container.

You can either use the script included in `package.json`:

```bash
bun db
```

**OR**

Manually start a **SurrealDB** container with the following Docker command:

```bash
docker run --rm --pull always -p 8000:8000 surrealdb/surrealdb:latest start --user root --pass root --allow-all memory
```

For more details, visit the [Official SurrealDB website](https://surrealdb.com).

Additionally, ensure that **[Ollama](https://ollama.com)** is up and running.

### Starting the Pilot

Once **SurrealDB** and **Ollama** are set up, you can launch both the frontend and backend by running:

```bash
bun dev
```

During startup, the backend will:

1. Automatically run database migrations.
2. Create a default user with the following credentials:
   - **Email:** `user@example.com`
   - **Password:** `password`

If it's your first time running the system, the backend will download the required language models via **Ollama**. These models may be several gigabytes in size, so please be patient and avoid interrupting the download process. The models will be stored locally and won't need to be downloaded again unless they are updated.

Once everything is ready, open your browser and navigate to:

[http://localhost:5173/](http://localhost:5173/)

You should see the login screen, where you can sign in using the default credentials mentioned above.

The backend API provides a OpenAPI UI at [http://localhost:5173/api](http://localhost:5173/api)

### Configuration

You can customize **BuildOwn.AI Pilot** by setting environment variables. Since Bun is used as the runtime, you can simply create a `.env` file in the root of the project to manage your configuration. For example:

```bash
PORT=3000
ENVIRONMENT=development
```

This allows you to adjust settings such as the port, environment, and database credentials as needed.

> [!TIP]
> See file [doc/configuration.md](./doc/configuration.md) for more detailed explaination.
