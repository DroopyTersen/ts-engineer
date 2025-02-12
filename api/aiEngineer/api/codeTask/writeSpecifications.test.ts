import { getDb, initDb } from "api/aiEngineer/db/pglite/pglite.server";
import { telemetry } from "api/telemetry/telemetry.server";
import { traceLLMEventEmitter } from "api/telemetry/traceLLMEventEmitter";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { modelProviders } from "~/toolkit/ai/llm/modelProviders";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { wait } from "~/toolkit/utils/wait";
import { createNewProject } from "../createNewProject";
import {
  writeSpecifications,
  WriteSpecificationsInput,
} from "./writeSpecifications";

describe("writeSpecifications", () => {
  let projectId = "";
  const CODE_TASKS = {
    AddChat: "Add the ability to chat with your project",
    AddWriteSpecificationsUI:
      "Add a UI for writing specifications code that already exists.",
    AddCodeTasksDB:
      "Save the coding task to the database after writeSpecifications. We'll need to create another db file kind of like files.db.ts or project.db.ts. It should have methods for createNewCodeTask and updateSpecifications",
    TracingIssues: "When i am tracing",
  };
  beforeAll(async () => {
    // Initialize in-memory database
    await initDb();

    // Add a test project to the database
    let formData = new FormData();
    formData.append("name", "Test Project");
    formData.append("absolutePath", "/Users/drew/code/ts-engineer");
    const testProject = await createNewProject(formData);
    console.log("TEST PROJECT CREATED!", testProject.id);
    projectId = testProject.id;
  });

  afterAll(async () => {
    // Close the database connection
    await getDb().close();
  });

  it("should generate specifications for a given input", async () => {
    // Arrange
    const input: WriteSpecificationsInput = {
      codeTaskId: "task123",
      input: CODE_TASKS.AddChat,
      projectId: projectId,
    };
    let trace = telemetry.createTrace("writeSpecifications", {
      input,
      sessionId: input.codeTaskId,
      user: {
        id: "bun:test",
      },
    });
    let claude = getLLM(modelProviders.anthropic("claude-3-5-sonnet-latest"));
    let gpt4omini = getLLM(modelProviders.openai("gpt-4o-mini"));
    let emitter = new LLMEventEmitter();
    // emitter.on("content", (delta) => {
    //   console.log(delta);
    // });
    traceLLMEventEmitter({
      emitter,
      telemetry: telemetry,
      parentObservableId: trace.id,
    });

    // Act
    const result = await writeSpecifications(input, {
      llm: gpt4omini,
      emitter,
      traceId: trace.id,
    });
    console.log("🚀 | result:", result.specifications);
    // Assert
    expect(result).toBeDefined();
    expect(result.specifications).toBeDefined();
    expect(typeof result.specifications).toBe("string");
    expect(result.specifications.length).toBeGreaterThan(0);

    trace.end(result.specifications);
    await wait(1000);
    // Add more specific assertions based on the expected structure of the specifications
  }, 90000); // Increase timeout to 30 seconds for LLM processing

  // it("should handle optional input fields", async () => {
  //   // Arrange
  //   const mockInput: WriteSpecificationsInput = {
  //     codeTaskId: "task456",
  //     input: "Refactor the authentication module",
  //     projectId: mockProjectId,
  //     specifications: "Initial specifications",
  //     followupInstructions: "Focus on improving performance",
  //   };

  //   // Act
  //   const result = await writeSpecifications(mockInput, mockLLM, mockEmitter);

  //   // Assert
  //   expect(result).toBeDefined();
  //   expect(result.specifications).toBeDefined();
  //   expect(typeof result.specifications).toBe("string");
  //   expect(result.specifications.length).toBeGreaterThan(0);
  //   // Add more specific assertions based on the expected structure of the specifications
  // }, 30000); // Increase timeout to 30 seconds for LLM processing

  // Add more test cases as needed, e.g., error handling, edge cases, etc.
});

const PROJECT_SUMMARY = `## Purpose
The project is a web application designed to assist software engineers in analyzing and summarizing codebases. It provides a comprehensive interface for managing projects, documenting code files, and generating project summaries. The app aims to streamline the process of understanding and navigating large codebases, thereby solving the problem of codebase complexity and aiding in efficient project management and collaboration.

## Tech Stack

| Name                                                                 | What is it?                                                                 |
|----------------------------------------------------------------------|----------------------------------------------------------------------------|
| **[Remix](https://remix.run/)**                                       | Full-stack web framework for building modern web applications.             |
| **[Tailwind CSS](https://tailwindcss.com/)**                          | Utility-first CSS framework for rapidly building custom user interfaces.   |
| **[Shadcn UI](https://ui.shadcn.com/)**                               | UI library for React, providing a set of reusable components.               |
| **[Bun](https://bun.sh/)**                                            | JavaScript runtime and package manager, optimized for speed.                |
| **[PostgreSQL](https://www.postgresql.org/)**                         | Powerful, open-source object-relational database system.                    |
| **[OpenAI](https://openai.com/)**                                     | AI research and deployment company, used for AI-related functionalities.    |
| **[Langfuse](https://langfuse.com/)**                                 | Analytics for LLMs, used for monitoring and analyzing AI performance.       |
| **[Vercel](https://llm.com/)**                                     | Cloud platform for static sites and Serverless Functions.                   |
| **[React](https://reactjs.org/)**                                     | JavaScript library for building user interfaces.                            |
| **[TypeScript](https://www.typescriptlang.org/)**                     | Typed superset of JavaScript that compiles to plain JavaScript.             |
| **[Zod](https://zod.dev/)**                                           | TypeScript-first schema validation with static type inference.              |
| **[Vitest](https://vitest.dev/)**                                     | Fast unit test framework for Vite projects.                                 |
| **[Hono](https://honojs.dev/)**                                       | Ultra-fast, middleware-based web framework for Cloudflare Workers.          |

## Project Structure

The project is organized into several key directories, each serving a specific purpose. Below is a table that outlines the paths of these directories and their purposes:

| Path          | Purpose                                                                 |
|---------------|-------------------------------------------------------------------------|
| /api          | Contains backend API code, including database interactions and logic.   |
| /app          | Frontend application code, including UI components and routes.          |
| /shared       | Shared types and schemas used across both frontend and backend.         |
| /tasks        | Scripts for development tasks, such as running the app and API together. |
| /toolkit      | Reusable utilities and hooks for both frontend and backend.              |
`;
