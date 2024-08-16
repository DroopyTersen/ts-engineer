import { convertToCoreMessages } from "ai";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getLLM } from "~/toolkit/ai/vercel/getLLM";
import { wait } from "~/toolkit/utils/wait";

export async function summarizeProjectMarkdown(
  codebaseMarkdown: string,
  emitter?: LLMEventEmitter
) {
  const systemMessage = {
    role: "system" as const,
    content: summarizeProjectPrompt(codebaseMarkdown),
  };
  let llm = getLLM("deepseek", "deepseek-coder");

  let sectionMessages = projectSummarySections.map((section) => ({
    role: "user" as const,
    content: `Please summarize the project using this template:\n##${section.title}\n${section.template}`,
  }));

  let allResults = await Promise.all(
    sectionMessages.map(async (message, index) => {
      let _innerEmitter = new LLMEventEmitter();
      _innerEmitter.on("content", (delta) => {
        console.log("🚀 | _innerEmitter.on | delta:", delta);
        emitter?.emit("data", {
          type: "section",
          index,
          delta,
        });
      });
      await wait(index * 300);
      let result = await llm.streamText(
        {
          messages: convertToCoreMessages([systemMessage, message]),
          temperature: 0.5,
          maxTokens: 2000,
        },
        {
          emitter: _innerEmitter,
        }
      );
      result.text;
    })
  );

  return allResults.join("\n\n");
}

const summarizeProjectPrompt = (codebaseMarkdown: string) => `
You are an expert senior software engineer with extensive experience in analyzing and summarizing codebases. Your task is to examine the given codebase and provide a comprehensive summary of the project using the specified output template. Approach this task with meticulous attention to detail and a deep understanding of software architecture and best practices.

Thoroughly review all files, directories, and documentation within the codebase.

Your summary should be:
- Comprehensive: Cover all aspects of the project structure and functionality.
- Accurate: Ensure all information is correct and reflects the current state of the codebase.
- Insightful: Provide valuable observations about the project's architecture and design choices.
- Clear and professional: Present information in a well-organized, easy-to-understand manner.
- Concise - prioritze what would be critical for a new developer to know about the codebase.

Here is the full codebase
<codebase>
${codebaseMarkdown}
</codebase>

Remember to base your analysis solely on the provided codebase, avoiding assumptions or speculation about features or functionalities not explicitly present in the code. Always prefer to use formatted text whenever possible (tables, bullets, bolds etc..). 
`;

const projectSummarySections = [
  {
    title: "Purpose",
    template: `Insert 1-2 sentences describing the project's purpose. Try do succinctly answer these questions:
Is it a web app? CLI? Mobile app? Library? 
-What does the app do from an end user perspective? What problem does it solve? 

Aim for clarity and conciseness. Aim for simple language. This section should give readers a quick understanding of what the project is about and why it exists. 

Very important - be succinct and to the point. This should be a very quick introduction to the project.
`,
  },
  {
    title: "Tech Stack",
    template: `Conduct a comprehensive analysis of the technology stack, covering both front-end and back-end technologies. List and describe the main technologies, frameworks, libraries, and tools used in the project. Include both frontend and backend technologies, as well as any DevOps or auxiliary tools
    
Provide a table of technologies, ordered by which would be most critical to know to work on this codebase.

Provide the following columns in the Tech Stack table,
- Name - bolded
- What is it? try to be as concise as possilbe

This section should help new developers quickly understand what they need to be familiar with to work on the project. Only include technologies that are critical to know about the project, it doesn't need to be a full list of everything. Limit it to no more than 12 technologies. 


Only show the technologies that a developer would need to know about to work on the project. So tiny utility libraries that are self explanatory don't need to be included.

Never mention a library that is not listed in the dependencies. of the project.

For npm packages, provide the technology name as link to the NPM package in this format: [Friendly Name](https://www.npmjs.com/package/EXACT_NAME_OF_PACKAGE_FROM_PACKAGE_JSON)

After providing the table there is no need for other commentary. Remember stop after about 12 technologies.`,
  },
  {
    title: "Project Structure",
    template: `Explain the organization of the project's directories and files. 
    
Provide a table showing the paths of key folders and their purposes. Provide a column for:
- Path - the path to the folder. prefix with "/"
- Purpose : very concise explanation about what can be found in that folder.
- Special Conventions : If applicable, describe any naming conventions or organizational patterns that are specific to this folder. Basically, guidance for what goes in here, and how the files should be named, and organized. If there is nothing specific to this folder, and it follows project level conventions, you can leave this blank.

Guidelines for the table:
-Choose the most important folders to discuss (no more than 10). 
-Only show folders, configuration files will be described somewhere else.

If applicable provide a table of naming conventions for filenames and folders.
- how are folder names formatted? how are they cased (camel, kebab, snake,etc...)? give an example of a folder from the project that matches this convention.
- how are file names formatted? how are they cased? give an example of a file from the project that matches this convention.
- Don't make anything up, only provide guidance based on consistent conventions already established in the codebase. Only document things that you've confirmed are consistently true based files and folders in the codebase.
- Better to leave this blank than to provide incorrect guidance.
`,
  },
  {
    title: "Developer Setup",
    template: `Provide detailed, step-by-step instructions for setting up the development environment. 
    
Include:
1. Instructions for installing dependencies
2. Configuration of environment variables or settings files
3. Commands to build and run the project locally
4. Any additional setup steps (e.g., database initialization)

Guidelines to follow when providing instructions:
- Ensure the instructions are clear enough for a new developer to follow without prior knowledge of the project.
- The following are other sections of documentation that will be provided to the user elsewhere, so you don't need to include these topics in detail here: Tech Stack, Project Structure, Deployment Process, Configuration Management, 3rd Party Integrations, User Interface, Authentication and Authorization, Data Access, End-to-End Flow, and User Interface

here is an example (that likely uses OLD versions of things we shouldn't recommend by default):
### 1. Install required tooling

- Install [VS Code](https://code.visualstudio.com).

- Install 18.16 of [**Node.js** (and v9.5.1 of \`npm\`)](https://nodejs.org/dist/v18.16.0/).
  - This will be used to run (locally) and build the application.
- Install the **Prettier** Extension for VS Code.
  - This will be used to format code after each file is saved.
  - Open up the Extensions view in VS Code and search for "Prettier" and install it.
  - Formatting will automatically be enabled via \`.vscode/settings.json\`.
- Optionally, if you wish to use the [Azure AI Video Indexer locally](#azure-ai-video-indexer), install **Azure CLI** for [Windows](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows?tabs=azure-cli) or [macOS](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-macos).
  - This will be used to extract video metadata such as transcripts.

### 2. Clone the repo and installl NPM dependencies

Open a terminal and clone the project:

\`\`\`
git clone https://github.com/CoreBTS/ai-rag-demo1
cd ai-rag-demo1
npm install
\`\`\`

### 3. Setup your local config

The project won't run correctly until you have setup a few local app settings.

1. Copy [\`.env.example\`](.env.example) to create a new file, \`.env\`.
2. Fill in any secrets. This file will not be included in source control (via the \`.gitignore\`).

### 4. Run the app

From the root of the project run the following command in your terminal:

\`\`\`
npm run dev
\`\`\`

This will start a local dev server that will automatically refresh whenever you make changes to your source code.
`,
  },
  {
    title: "End-to-End Flow",
    template: `
### E2E Flow
Provide a Step-by-step walkthrough of a typical user request, from initiation to response
    - make sure to identify key elements of the application architecture (frontend/client, backend/server, database, identity provider, external Services/APIs, caching layer etc...)
    - What happens clientside, what happens server side? when do we call a db? do we call an auth provider? etc... 
    - Use Mermaid sequence diagram to illustrate complex flows. Put mermaid diagrams in code blocks tagged with the 'mermaid' language.

This section should give developers a clear understanding of how the different parts of the system work together and how data moves through the application. `,
  },

  {
    title: "Data Access",
    template: `Explain the data storage and access patterns used in the project. If provided cover the following:
- Database(s) used and their purpose
- ORM or data access libraries employed, data access patterns (e.g., repositories, data mappers). Show code examples.
- Key data models or schemas
- Any caching mechanisms
- Handling of database migrations or schema changes

For any code snippets, focus just on the important elements and put a comment like "code omitted for brevity

Important - if the project doesn't have any external integrations just respond with the following:
## Data Access
N/A
".
`,
  },
  {
    title: "External APIs",
    template: `List any any 3rd party APIs that are called. This could be direct HTTP callas or SDKs that communicated with external services. For example any API calls we make to things like LLMs, CMSs etc... Only list hosted services and APIs, don't mention tools and code libraries, or databases that are owned by this project. Basically any HTTP Api requests we are making to something outside our project.

  Respond as a table with the following columns
  - Name
  - Usage Explanation - very brief concise explanation
  - Source Code - if applicable, link to the file where most of the logic for using this API is implemented.

Important - if the project doesn't have any external integrations just respond with the following:

## External APIs
N/A
  `,
  },
  //   {
  //     title: "API Documentation",
  //     template: `[If the project includes an API, provide comprehensive documentation. Include:
  // - Authentication methods
  // - List of endpoints with their HTTP methods, request parameters, and response formats.
  // - Any rate limiting or usage restrictions
  // - Error handling and status codes
  // - Examples of requests and responses for each endpoint

  // Consider using a standardized format like OpenAPI/Swagger. If the API is extensive, provide a link to full API documentation and include the most important or commonly used endpoints here.]`,
  //   },
  {
    title: "User Interface",
    template: `### Screens
For projects with a user interface, describe the main screens or routes. Provice a table of the main screens/routes. Name, Route, Purpose.

### Routing
For web applications or apps, explain the routing mechanism. otherwise say N/A

### Data Fetching 
How the UI connects to the backend for data reads and data writes (if applicable). How does data get on a the screen? Client side fetch? Server side and then server rendered?
Use Mermaid sequence diagram to illustrate the flow with filenames as the actors/participants. Put mermaid diagrams in code blocks tagged with the 'mermaid' language. 

Here is an example mermaid sequence diagram.
\`\`\`mermaid
sequenceDiagram
    participant User
    participant Index as app/routes/_index.tsx
    participant Action as app/routes/_index.tsx<br>Remix action
    participant API as app/routes/api.more-examples.tsx<br>Remix action
    participant Backend

    User->>Index: Interacts with the form
    Index->>Action: Submits form data
    Action->>API: Calls API for additional examples
    API->>Backend: Requests data
    Backend-->>API: Returns data
    API-->>Action: Returns response
    Action-->>Index: Updates state with new data
    Index-->>User: Renders updated UI
\`\`\`
`,
  },
  {
    title: "Auth",
    template: `Explain the methods used for user authentication and authorization. Cover:
- How do we know who they are?
    - What is the identity provider?
    - How do we persist the identity? (cookie? session? jwt? etc...)
- How do we know what they are allowed to do?
- User roles and permissions system
  - How do we control what they see in the UI? (code examples)
  - How do we control the data they can access in the backend? (code examples)
- If the project doesn't if any auth, that is okay, responde with the section title heading followed by "N/A" and nothing else.
- Make sure to cover the various aspects of how auth is implemented across the stack
- Any third-party authentication services integrated
- Make sure to include code snippets showing how to implement authentication checks.


Important - if the project doesn't have any auth just respond with the following:
## Auth
N/A
`,
  },
  {
    title: "Configuration Management",
    template: `Describe how the project handles different configurations. Include:
- How environment-specific settings are managed
- Use of environment variables
- Configuration files and their purposes
- Any provided secrets management approaches, if used (look for .env or .env.example files. if found explain how those are used for local dev)

Here is an example:
### Environment Variables

- \`.dev.vars\` - used for local environment variables. Automatically picked up by Cloudflare Workers local process. Do NOT check this file into source control
- \`.dev.vars.example\` - a copy of .dev.vars, except with secrets removed. Added to source control so developers know which values are needed in their \`.dev.vars\`.

### Configuration Files
- \`wrangler.toml\`: used to configure Cloudflare Workers and Pages, including bindings for services, KV namespaces, and environment variables.
- \`tailwind.config.ts\`: Tailwind CSS settings.
- \`postcss.config.js\`: configures PostCSS plugins.
- \`tsconfig.json\`: Sets TypeScript compiler options and path aliases
- \`vite.config.ts\`: Configures Vite for the development server and build process`,
  },
  //   {
  //     title: "Testing Strategy",
  //     template: `[Outline the approach to testing in the project. Cover:
  // - Types of tests used (unit, integration, end-to-end)
  // - Testing frameworks and tools
  // - Directory structure for tests
  // - How to run tests locally
  // - Any continuous integration setup for automated testing
  // - Code coverage requirements or goals
  // - Best practices for writing tests in this project

  // Include examples of test cases for different types of tests. Explain any mocking strategies or test data generation approaches used.]`,
  //   },
  {
    title: "Deployment Process",
    template: `Detail the steps and tools used for deploying the application. If provided, include a bulleted list describing:
- Deployment environments (e.g., staging, production)
- Step-by-step deployment process if provided
- Any CI/CD pipelines and how they're configured
- Hosting platform or infrastructure used
- How environment-specific configurations are handled during deployment

If using containerization, explain the Docker setup. Include any scripts or commands used in the deployment process. Describe how to troubleshoot common deployment issues.

If any of the items you've been asked to describe are not applicable, ignore them and move on. You don't need to describe what is not applicable.

Keep this pretty brief. Just describe an overview of what is happening.`,
  },
  {
    title: "Styling and Component Libraries",
    template: `
### Styling
- CSS methodology used (e.g., BEM, CSS Modules, CSS-in-JS, Tailwind)
- Any preprocessors or postprocessors used
- be very brief.

### Component Library
- Component library or design system, if applicable
- Theming or customization capabilities
- Any style guide or visual design principles followed

### Theming
If applicable, describe how to modify the color theme
`,
  },
];
