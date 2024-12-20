import { LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { wait } from "~/toolkit/utils/wait";

export async function generateProjectSummary(
  projectContext: {
    title?: string;
    summary?: string;
    fileStructure: string;
    fileContents: string[];
  },
  options: {
    delayInMs?: number;
    llm: LLM;
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
  let llm = options.llm;

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
      await wait(index * (options.delayInMs || 300));
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
          maxTokens: 3000,
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
  /*
  The full list of filespaths in the project
  */
  fileStructure: string,
  /*
  A list of filespaths followed by the content of the file.
  */
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
- Make sure to provide code snippets in full \`\`\` code blocks with a language tag. Make sure to add new line whitespace before and after the code block.
- Leverage Mermaid diagrams when asked. Try to use project specific details when labeling diagrams (whta kind of DB? what folder are the api server endpoints in? etc... ). Don't add any commentary or additional preamble to the diagrams. Just provide the diagram. Always add a new line before and after the diagram's code block.
- Avoid adding any commentary or additional preamble. We want this to be quickly digestible by developers. Keep it direct and to the point.
- Don't add any Heading2 elements. The section title heading Tech Stack, Data Access, Project Structure, etc... will be rendered elsewhere. You should begin the response with the section content an skip the section title heading.

Here is are the project files:
<files>
${fileStructure}
</files>
Here is the full codebase
<codebase>
${fileContents.join("\n\n").slice(0, 110_000 * 4)}
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

Start by identifying the key elements of the application architecture (frontend/client, backend/server, app, api, database, identity provider, external Services/APIs, caching layer etc...). Not every app will have all of these elements. Take your time and think carefully about what architecture you can derive from the provided source code.

- Try to be specific, identify project specific details. For example, don't just say "Database", say wwhat kind of DB it is. 
- Try to also capture where and how these elements are hosted. Cloud provider? which one? which resources are colocated?

Response Format:
First provide a bulleted list of the key elements of the architecture. Explain what it is, where it is hosted and how it is connected to other elements.

Then diagram the architecture with Mermaid. Try to show a sophisticated enterprise architecture diagram, where things are organized into layers and cloud providers and network boundaries and different services are connected to each other.

`,
  },
  {
    title: "Data Model",
    template: `Describe the core entities in the system and their relationships. Include:
- Main entities/tables and their purpose
- Key fields for each entity
- Relationships between entities (one-to-many, many-to-many, etc.)
- Any important constraints or business rules

If possible, include a Mermaid class diagram to visually represent the data model. Use the following format:

\`\`\`mermaid
classDiagram
    class Entity1 {
        +field1: type
        +field2: type
    }
    class Entity2 {
        +field1: type
        +field2: type
    }
    Entity1 "1" -- "*" Entity2 : relationship
\`\`\`


Here is an example of a good description of entities and their purpose:
<example>
- **Chat Conversations**:

  - Each conversation is private and only visible to the user who created it.
  - A conversation consists of multiple messages.
  - Each message within a conversation is associated with a specific assistant.
    - You can switch between assistants in the chat to get answers from different "personalities" or "knowledge bases".

- **Assistants**:

  - Assistants come with custom instructions, Tools, and Data Sources.
  - Users can select which assistant they are talking to in a conversation.
  - Assistants can be public or private.
  - Public assistants are visible to all users.
  - Private assistants are only visible to users who have been granted **Assistant Permissions** permissions.

- **Data Sources**:
  - Data sources are used to provide the assistant with information relevant to the conversation, a knowledge base.
  - When an Assistant is responding it will perform a hybrid search (keyword and vector search) across all of the Assistant's Data Sources to find information relevant to the conversation.
  - Data sources can be added by users and are specific to assistants.
  - Only users with access to the Assistant can view data in from those Data Sources.

- **Tool Instances**:

  - Each assistant has specific tool instances configured.
  - These tools are used to enhance the assistant's capabilities and provide custom functionalities during the conversation.
  - A Tool Instance is a specific instance of a configured **Tool Definition**.

</example>

If the project doesn't have a data model, just say "None" and move on.
`,
  },
  {
    title: "Data Access",
    template: `Explain the data storage and access patterns used in the project. If provided cover the following:
- Database(s) used and their purpose
- ORM or data access libraries employed, data access patterns (e.g., repositories, data mappers). Show code examples.
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
    template: `For projects with a user interface, describe the main screens or routes. Provide a 3 column table of the main screens/routes. Name, Route (provide both the route path, and the filename where that route is implemented in the same column separated by a newline), Purpose]. If the project doesn't have a UI just respond with N/A

### Routing
[For web applications or apps, explain the routing mechanism, file based? convention based? etc.... otherwise say N/A]. If applicable, briefly explain how you'd add a new route/screen.
`,
  },
  {
    title: "Data Fetching",
    template: `Explain how the UI connects to the backend for data reads and data writes (if applicable). How does data get on a the screen? Client side fetch? Server side and then server rendered? What happens clientside, what happens server side? when do we call a db? do we call an auth provider? etc... 

Provide a Step-by-step walkthrough of a typical user request, from initiation to response
- The goal is to provide a clear understanding of how a specific request flows through the system.
- Use Mermaid sequence diagram to illustrate complex flows. Put mermaid diagrams in code blocks tagged with the 'mermaid' language. On the mermaid diagram, project specific's ex: what kind of DB is it? what folder are the api server endpoints in? etc...

Use Mermaid sequence diagram to illustrate the flow with filenames as the actors/participants. 

Here is a really basic example mermaid sequence diagram.
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
    template: `Explain the methods used for user authentication and authorization. Focus on explaining how it works and showing usage examples of any provided abstractions. You don't need to show the implementation of the abstraction.
<topics_to_cover>
- How do we know who they are?
    - What is the identity provider? Is it a 3rd party? DIY?
    - How do we persist the identity? (cookie? session? jwt? etc...), and verify they are logged in?
    - Speak to any utililty functions that are used to get the current user.
- How do we know what they are allowed to do?
  - User roles and permissions system
  - How do we control what they see in the UI? (code examples)
  - How do we control the data they can access in the backend? (code examples)
</topics_to_cover>

<guidelines>
- If the project doesn't if any auth, that is okay. Just succinctly say "This app doesn't have any auth" and be done.
- Make sure to describe the various aspects of how auth is implemented across the stack. You don't need to show the whole implementation, just explain what's happening and show brief usage examples.
- Make sure to include code snippets showing how perform auth checks in various parts of the app. You don't need to show the implementation, just brief usage examples.
</guidelines>
`,
  },
  {
    title: "Configuration Management",
    template: `Describe how the project handles different configurations. Include:
- Environment Variables -How environment-specific settings are managed
  - Any provided secrets management approaches, if used (look for .env or .env.example files. if found explain how those are used for local dev)
  - Use of environment variables
- Other Configuration - Configuration files and their purposes

Here is an example:
### Environment Variables

- \`.dev.vars\` - used for local environment variables. Automatically picked up by Cloudflare Workers local process. Do NOT check this file into source control
- \`.dev.vars.example\` - a copy of .dev.vars, except with secrets removed. Added to source control so developers know which values are needed in their \`.dev.vars\`.

### Other Configurations
- \`wrangler.toml\`: used to configure Cloudflare Workers and Pages, including bindings for services, KV namespaces, and environment variables.
- \`tailwind.config.ts\`: Tailwind CSS settings.
- \`postcss.config.js\`: configures PostCSS plugins.
- \`tsconfig.json\`: Sets TypeScript compiler options and path aliases
- \`vite.config.ts\`: Configures Vite for the development server and build process`,
  },
  {
    title: "Deployment Process",
    template: `Detail the steps and tools used for deploying the application. Keep this pretty brief. Just describe an overview of what is happening. If something is not applicable, just skip it.
<response_format>
## Environments
[List the environments that the project has. For example: Development, Staging, Production. What is the hosting platform? ]

## Deployment Steps
[List the steps to deploy the project. Include the following if applicable:
  - Step-by-step deployment process if provided
  - A brief overview of any CI/CD pipelines
  - How environment-specific configurations are handled during deployment
  - If using containerization, explain the Docker setup. Include any scripts or commands used in the deployment process. Describe how to troubleshoot common deployment issues.
]
</response_format>

If any of the items you've been asked to describe are not applicable, ignore them and move on. You don't need to describe what is not applicable.
`,
  },
  {
    title: "Styling and Component Libraries",
    template: `Describe the follwing topics if applicable. No headings, just a bulleted list of any applicable topics.
  - CSS methodology used (e.g., BEM, CSS Modules, CSS-in-JS, Tailwind)
  - Component library or design system, if applicable
  - Guidance: Any code patterns, style guide or visual design principles followed
  - Theming or customization capabilities
`,
  },
];
