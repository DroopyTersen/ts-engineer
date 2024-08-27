import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getLLM, LLM } from "~/toolkit/ai/vercel/getLLM";
import { wait } from "~/toolkit/utils/wait";

export async function summarizeProjectMarkdown(
  projectContext: {
    title: string;
    summary?: string;
    fileStructure: string;
    fileContents: string[];
  },
  options: {
    llm?: LLM;
    emitter?: LLMEventEmitter;
  }
) {
  const systemMessage = {
    role: "system" as const,
    content: summarizeProjectPrompt(
      projectContext.fileStructure,
      projectContext.fileContents
    ),
  };
  let emitter = options.emitter || undefined;
  let llm = options.llm || getLLM("deepseek", "deepseek-coder");

  let sectionMessages = projectSummarySections.map((section) => ({
    role: "user" as const,
    content: `Please summarize the project based on the following instructions:\n${section.template}.
    
    Respond with.
    ## ${section.title}
    [your summary here. If the section is not applicable, respond with "N/A"]`,
  }));

  let allResults = await Promise.all(
    sectionMessages.map(async (message, index) => {
      let sectionTitle = projectSummarySections[index]?.title;
      let _innerEmitter = new LLMEventEmitter();
      _innerEmitter.on("content", (delta) => {
        emitter?.emit("data", {
          type: "section",
          index,
          delta,
        });
      });
      await wait(index * 300);
      let result = await llm.streamText(
        {
          messages: [
            systemMessage,
            {
              role: "user",
              content: [{ type: "text", text: message.content }],
            },
          ],
          temperature: 0.3,
          maxTokens: 2000,
        },
        {
          emitter: _innerEmitter,
        }
      );
      return result.text;
    })
  );

  return allResults.join("\n\n");
}

const summarizeProjectPrompt = (
  fileStructure: string,
  fileContents: string[]
) => `
You are an expert senior software engineer with extensive experience in analyzing and summarizing codebases. Your task is to examine the given codebase and provide a comprehensive summary of the project using the specified output template, that can be placed in the project's README.md file. Approach this task with meticulous attention to detail and a deep understanding of software architecture and best practices.

Thoroughly review all files, directories, and documentation within the codebase.

Your summary should be:
- Comprehensive: Cover all aspects of the project structure and functionality.
- Accurate: Ensure all information is correct and reflects the current state of the codebase.
- Insightful: Provide valuable observations about the project's architecture and design choices.
- Clear and professional: Present information in a well-organized, easy-to-understand manner.
- Concise - prioritze what would be critical for a new developer to know about the codebase.
- Make sure to provide code snippets in full \`\`\` code blocks with a language tag.
- Leverage Mermaid diagrams when asked. Try to use project specific details when labeling diagrams (whta kind of DB? what folder are the api server endpoints in? etc... ). Don't add any commentary or additional preamble to the diagrams. Just provide the diagram.
- Avoid adding any commentary or additional preamble. We want this to be quickly digestible by developers. Keep it direct and to the point.
- Don't add any Heading2 elements. The section title heading Tech Stack, Data Access, Project Structure, etc... will be rendered elsewhere. You should begin the response with the section content an skip the section title heading.

Here is are the project files:
<files>
${fileStructure}
</files>
Here is the full codebase
<codebase>
${fileContents.join("\n\n")}
</codebase>

Remember to base your analysis solely on the provided codebase, avoiding assumptions or speculation about features or functionalities not explicitly present in the code. Always prefer to use formatted text whenever possible (tables, bullets, bolds etc..), write in the style of a README.md file. 
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
    template: `Conduct a comprehensive analysis of the technology stack, covering both front-end and back-end technologies. List and describe the main technologies, frameworks, libraries, and tools used in the project. Include botfh frontend and backend technologies, as well as any DevOps or auxiliary tools
    
Provide a table of technologies, ordered by which would be most critical to know to work on this codebase.

Provide the following columns in the Tech Stack table.
- Name - bolded
- What is it? try to be as concise as possible

This section should help new developers quickly understand what they need to be familiar with to work on the project. Only include technologies that are critical to know about the project, it doesn't need to be a full list of everything. Limit it to no more than 12 technologies. 

First think about your list of technologies based primarily on the project's dependencies file (ex: package.json or requirements.txt). 

Never mention a library that is not listed in the dependencies. of the project. Don't list a technology twice!

If you know the website for a technology, provide the link to that.

For npm packages, provide the technology name as link to the NPM package in this format: [Friendly Name](https://www.npmjs.com/package/EXACT_NAME_OF_PACKAGE_FROM_PACKAGE_JSON). 

After providing the table there is no need for other commentary. Remember stop after about 12 technologies. The table should never be more than 12 rows. Only provide the one table, and don't repeat anything.`,
  },
  {
    title: "Project Structure",
    template: `Provide a table highlighting the organization of the project's directories and files. 
    
Provide a table showing the paths of key folders and their purposes. Provide a column for:
- Path - the path to the folder. prefix with "/"
- Purpose : very brief, concise explanation about what can be found in that folder.

Guidelines for the table:
-Choose the most important folders to discuss (no more than 10). 
-Only show folders, configuration files will be described somewhere else.
`,
  },
  {
    title: "Developer Setup",
    template: `Provide detailed, step-by-step instructions for setting up the development environment. 
    
Include:
1. Instructions for installing dependencies
2. Configuration of environment variables or settings files
3. Commands to build and run the project locally

Guidelines to follow when providing instructions:
- Ensure the instructions are clear enough for a new developer to follow without prior knowledge of the project.
- The following are other sections of documentation that will be provided to the user elsewhere, so you don't need to include these topics in detail here: Tech Stack, Project Structure, Deployment Process, Configuration Management, 3rd Party Integrations, User Interface, Authentication and Authorization, Data Access, End-to-End Flow, and User Interface

here is an example (that likely uses OLD versions of things we shouldn't recommend by default):
### 1. Install required tooling

- Install [VS Code](https://code.visualstudio.com).
- Install 18.16 of [**Node.js** (and v9.5.1 of \`npm\`)](https://nodejs.org/dist/v18.16.0/).
  - This will be used to run (locally) and build the application.


### 2. Clone the repo and installl NPM dependencies

Open a terminal and clone the project:

\`\`\`
git clone <YOUR_REPO>
cd your-repo
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
    title: "Architecture",
    template: `This section should give developers a clear understanding of how the different parts of the system work together and how data moves through the application. 

Start by identifying the key elements of the application architecture (frontend/client, backend/server, database, identity provider, external Services/APIs, caching layer etc...). Try to be specific, identify project specific details. For example, don't just say "Database", say wwhat kind of DB it is. If possible diagram the architecture similar to this example, where each layer is a box, and important technologies are listed in the boxes:
\`\`\`mermaid
flowchart TB
subgraph App["Frontend/Client (/app)"]
    direction TB
    A["React, Remix, Tailwind CSS"]
end

subgraph API["Backend/Server (/api)"]
    direction TB
    D["Bun, Hono, API Endpoints"]
end

subgraph DB["Database (/api/aiEngineer/db)"]
    direction TB
    G[PostgreSQL/PGLite]
end

subgraph External["External Services/APIs"]
    direction TB
    H[OpenAI]
    I[Anthropic]
    J[Deepseek]
    K[Langfuse]
end

App --> API
API --> DB
API --> External
\`\`\`


Next, provide a Step-by-step walkthrough of a typical user request, from initiation to response
- What happens clientside, what happens server side? when do we call a db? do we call an auth provider? etc... 
- Use Mermaid sequence diagram to illustrate complex flows. Put mermaid diagrams in code blocks tagged with the 'mermaid' language. On the mermaid diagram, project specific's ex: what kind of DB is it? what folder are the api server endpoints in? etc... 
`,
  },

  {
    title: "Data Access",
    template: `Explain the data storage and access patterns used in the project. If provided cover the following:
- Database(s) used and their purpose
- ORM or data access libraries employed, data access patterns (e.g., repositories, data mappers). Show code examples.
- Key data models or schemas. Show the data models/entities as a Mermaid UML or Class diagram 
- Handling of database migrations or schema changes
- If the project doesn't have any data access just say "None" and move on.

For any code snippets, focus just on the important elements and put a comment like "code omitted for brevity. 
".
`,
  },
  {
    title: "External APIs",
    template: `List any any 3rd party/external APIs that are called. This could be direct HTTP calls or SDKs that communicated with external services. For example any API calls we make to things like LLMs, CMSs etc... Only list hosted services and APIs, don't mention tools and code libraries, or databases that are owned by this project. Basically any HTTP Api requests we are making to something outside our project. If the project doesn't have any external API calls just say "None" and move on.

  Respond as a table with the following columns
  - Name
  - Usage Explanation - very brief concise explanation
  - Source Code - if applicable, link to the file where most of the logic for using this API is implemented.
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
    title: "Screens",
    template: `For projects with a user interface, describe the main screens or routes. Provide a table of the main screens/routes. Name, Route (provide both the route path, and the filename where that route is implemented), Purpose]. If the project doesn't have a UI just respond with N/A

### Routing
[For web applications or apps, explain the routing mechanism, file based? convention based? etc.... otherwise say N/A]
`,
  },
  {
    title: "Data Fetching",
    template: `Explain how the UI connects to the backend for data reads and data writes (if applicable). How does data get on a the screen? Client side fetch? Server side and then server rendered?
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
