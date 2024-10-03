import { createAzure } from "@ai-sdk/azure";
import { generateText } from "ai";
import { Glob } from "bun";
import { exec } from "child_process";
import { readFile, writeFile } from "fs/promises";
import { basename, join } from "path";
import { promisify } from "util";

function testGlobs(filepath: string, globs: string[]) {
  let hasMatch = globs.some((glob) => {
    let g = new Glob(glob.toLowerCase());
    return g.match(filepath.toLowerCase());
  });
  return hasMatch;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function filterFilePaths(
  filepaths: string[],
  includes: string[] = [],
  excludes: string[] = []
) {
  let files = filepaths;
  if (includes.length > 0) {
    files = files.filter((file) => testGlobs(file, includes));
  }
  if (excludes.length > 0) {
    files = files.filter((file) => !testGlobs(file, excludes));
  }
  return files;
}
const execAsync = promisify(exec);

const runShellCommand = async (absolutePath: string, command: string) => {
  try {
    const { stdout } = await execAsync(`cd ${absolutePath} && ${command}`);
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing shell command: ${command}`);
    throw error;
  }
};

const getProjectFiles = async (absolutePath: string) => {
  const output = await runShellCommand(
    absolutePath,
    "git ls-files --exclude-standard -c && git ls-files --others --exclude-standard"
  );
  let files = output.split("\n").filter(Boolean);
  // Exclude unwanted files (you can customize this list)
  const excludes = [
    "**/*.png",
    "**/*.jpg",
    "**/*.svg",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.lockb",
    "**/:memory:/*",
    "**/*.webp",
    "**/*.pdf",
    "**/*.ico",
    "**/*.excalidraw",
    "**/requirements.txt",
    "**/package-lock.json",
    "**/.gitignore",
    "**/.vscode/**",
    "**/data/**",
    "**/.DS_Store",
    "**/public/**",
    "**/*.patch",
  ];
  // Filter out excluded files
  files = filterFilePaths(files, [], excludes);
  return files;
};

const getFileContent = async (filePath: string) => {
  try {
    const content = await readFile(filePath, "utf8");
    return content;
  } catch {
    return "File not found: " + filePath;
  }
};

const getFileContents = async (
  filePaths: string[],
  projectPath: string,
  maxTokens = 100_000,
  maxLinesPerFile = 150
) => {
  let totalChars = 0;
  const fileContents: string[] = [];

  for (const filepath of filePaths) {
    const fullPath = join(projectPath, filepath);
    const content = await getFileContent(fullPath);
    totalChars += content.length;
    if (totalChars / 4 > maxTokens) break;
    const formattedContent = formatFileContent(
      filepath,
      content,
      maxLinesPerFile
    );
    fileContents.push(formattedContent);
  }

  return fileContents;
};

const formatFileContent = (
  filepath: string,
  content: string,
  maxLines: number
) => {
  const firstNLines = content.split("\n").slice(0, maxLines).join("\n");
  const fileExtension = filepath.split(".").pop() || "";
  return `
${filepath}
\`\`\`${fileExtension}
${firstNLines}
\`\`\`
`;
};

const formatFileStructure = (filePaths: string[]) => `
## File Structure

\`\`\`
${filePaths.join("\n")}
\`\`\`
`;

const generateProjectSummary = async (projectContext: {
  title: string;
  fileStructure: string;
  fileContents: string[];
}) => {
  const systemMessage = `
You are an expert senior software engineer with extensive experience in analyzing and summarizing codebases. Your task is to examine the given codebase and provide a comprehensive summary of the project using the specified output template, that can be placed in the project's README.md file. Approach this task with meticulous attention to detail and a deep understanding of software architecture and best practices.

Thoroughly review all files, directories, and documentation within the codebase.

Your summary should be:
- Comprehensive: Cover all aspects of the project structure and functionality.
- Accurate: Ensure all information is correct and reflects the current state of the codebase.
- Insightful: Provide valuable observations about the project's architecture and design choices.
- Clear and professional: Present information in a well-organized, easy-to-understand manner.
- Concise - prioritize what would be critical for a new developer to know about the codebase.
- Make sure to provide code snippets in full \`\`\` code blocks with a language tag. Make sure to add new line whitespace before and after the code block.
- Leverage Mermaid diagrams when asked. Try to use project specific details when labeling diagrams (what kind of DB? what folder are the api server endpoints in? etc... ). Don't add any commentary or additional preamble to the diagrams. Just provide the diagram. Always add a new line before and after the diagram's code block.
- Avoid adding any commentary or additional preamble. We want this to be quickly digestible by developers. Keep it direct and to the point.
- Don't add any Heading2 elements. The section title heading Tech Stack, Data Access, Project Structure, etc... will be rendered elsewhere. You should begin the response with the section content and skip the section title heading.

Here are the project files:
<files>
${projectContext.fileStructure}
</files>
Here is the full codebase
<codebase>
${projectContext.fileContents.join("\n\n").slice(0, 110000 * 4)}
</codebase>

Remember to base your analysis solely on the provided codebase, avoiding assumptions or speculation about features or functionalities not explicitly present in the code. Always prefer to use formatted text whenever possible (tables, bullets, bolds etc..), write in the style of a README.md file.
`;

  const projectSummarySections = [
    {
      title: "Purpose",
      template: `Insert 1-2 sentences describing the project's purpose. Try to succinctly answer these questions:
Is it a web app? CLI? Mobile app? Library?
- What does the app do from an end user perspective? What problem does it solve?

Aim for clarity and conciseness. Aim for simple language. This section should give readers a quick understanding of what the project is about and why it exists.

Very important - be succinct and to the point. This should be a very quick introduction to the project.
`,
    },
    {
      title: "Tech Stack",
      template: `Conduct a comprehensive analysis of the technology stack, covering both front-end and back-end technologies. List and describe the main technologies, frameworks, libraries, and tools used in the project. Include both frontend and backend technologies, as well as any DevOps or auxiliary tools

Provide a table of technologies, ordered by which would be most critical to know to work on this codebase.

Provide the following columns in the Tech Stack table.
- Name - bolded
- What is it? try to be as concise as possible

This section should help new developers quickly understand what they need to be familiar with to work on the project. Only include technologies that are critical to know about the project, it doesn't need to be a full list of everything. Limit it to no more than 12 technologies.

First think about your list of technologies based primarily on the project's dependencies file (ex: package.json or requirements.txt).

Never mention a library that is not listed in the dependencies of the project. Don't list a technology twice!

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
- Choose the most important folders to discuss (no more than 10).
- Only show folders, configuration files will be described somewhere else.
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

### 2. Clone the repo and install NPM dependencies

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

- Try to be specific, identify project specific details. For example, don't just say "Database", say what kind of DB it is.
- Try to also capture where and how these elements are hosted. Cloud provider? which one? which resources are colocated?

Response Format:
First provide a bulleted list of the key elements of the architecture. Explain what it is, where it is hosted and how it is connected to other elements.

Then diagram the architecture with Mermaid. Try to show a sophisticated enterprise architecture diagram, where things are organized into layers and cloud providers and network boundaries and different services are connected to each other.
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

For any code snippets, focus just on the important elements and put a comment like "code omitted for brevity.".
`,
    },
    {
      title: "External APIs",
      template: `List any 3rd party/external APIs that are called. This could be direct HTTP calls or SDKs that communicate with external services. For example any API calls we make to things like LLMs, CMSs etc... Only list hosted services and APIs, don't mention tools and code libraries, or databases that are owned by this project. Basically any HTTP API requests we are making to something outside our project. If the project doesn't have any external API calls just say "None" and move on.

Respond as a table with the following columns
- Name
- Usage Explanation - very brief concise explanation
- Source Code - if applicable, link to the file where most of the logic for using this API is implemented.
`,
    },
    {
      title: "Screens",
      template: `For projects with a user interface, describe the main screens or routes. Provide a 3 column table of the main screens/routes. Name, Route (provide both the route path, and the filename where that route is implemented in the same column separated by a newline), Purpose. If the project doesn't have a UI just respond with N/A

### Routing
[For web applications or apps, explain the routing mechanism, file based? convention based? etc.... otherwise say N/A]. If applicable, briefly explain how you'd add a new route/screen.
`,
    },
    {
      title: "Data Fetching",
      template: `Explain how the UI connects to the backend for data reads and data writes (if applicable). How does data get on a the screen? Client side fetch? Server side and then server rendered? What happens clientside, what happens server side? when do we call a db? do we call an auth provider? etc...

Provide a Step-by-step walkthrough of a typical user request, from initiation to response
- The goal is to provide a clear understanding of how a specific request flows through the system.
- Use Mermaid sequence diagram to illustrate complex flows. Put mermaid diagrams in code blocks tagged with the 'mermaid' language. On the mermaid diagram, project specifics ex: what kind of DB is it? what folder are the api server endpoints in? etc...

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
`,
    },
  ];

  let sectionsContent = "";
  let sectionMessages = projectSummarySections.map((section) => ({
    role: "user" as const,
    content: `Please summarize the project based on the following instructions:\n${section.template}.
    
    Respond with:
    ## ${section.title}
    [your summary here. If the section is not applicable, respond with "N/A"]`,
  }));
  let allResults = await Promise.all(
    sectionMessages.map(async (message, index) => {
      await wait(index * 5000);
      return await callOpenAI(systemMessage, message.content);
    })
  );

  return allResults.join("\n\n");
};

const callOpenAI = async (systemMessage: string, userMessage: string) => {
  let azureProvider = createAzure({
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    resourceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
  });
  let model = azureProvider(process.env.AZURE_OPENAI_FAST_LLM_DEPLOYMENT_NAME!);

  const result = await generateText({
    model,
    system: systemMessage,
    prompt: userMessage,
    maxTokens: 3000,
  });

  return result.text;
};

const generateExecutionFramework = async (absolutePath: string) => {
  const filepaths = await getProjectFiles(absolutePath);
  const fileContents = await getFileContents(filepaths, absolutePath);
  const title = basename(absolutePath);
  const fileStructure = formatFileStructure(filepaths);
  const summary = await generateProjectSummary({
    title,
    fileStructure,
    fileContents,
  });
  await writeFile(join(absolutePath, "EXECUTION_FRAMEWORK.md"), summary);
  console.log("Execution Framework generated at EXECUTION_FRAMEWORK.md");
};

const main = async () => {
  const args = process.argv.slice(2);
  const pathArgIndex = args.indexOf("--path");
  let path = "";

  if (pathArgIndex !== -1 && args[pathArgIndex + 1]) {
    path = args[pathArgIndex + 1];
  } else {
    console.error("Error: --path argument is required.");
    process.exit(1);
  }

  if (!path.startsWith("/")) {
    console.error("Error: The provided path must be an absolute path.");
    process.exit(1);
  }

  try {
    await generateExecutionFramework(path);
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

main();
