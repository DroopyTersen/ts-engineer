import { generateDiagram } from "./generateDiagram";

const description = `

graph TD
    subgraph Azure Cloud
        AAS[Azure App Service]
        AAD[Azure AD]
        DB[Azure SQL for PostgreSQL]
        AIS[Azure AI Search]
        AOAI[Azure OpenAI]
        ACR[Azure Container Registry]
    end

    subgraph Client
        FRONTEND[React/Remix Frontend]
    end

    subgraph GitHub
        REPO[GitHub Repository]
        GHA[GitHub Actions]
    end

    FRONTEND -- HTTPS --> AAS
    AAS -- Database Queries --> DB
    AAS -- API Calls --> AIS
    AAS -- API Calls --> AOAI
    AAS -- Authentication --> AAD
    AAS -- Pulls latest image --> ACR

    REPO -- On push to main --> GHA
    GHA -- Build & Push Docker image with :latest tag --> ACR
`;

// const description = `
// Show me a typical enterprise application where it's a react front end with a .NET API back end hosted in Azure with Azure SQL Server and Key Vault and Azure AD auth and kind of what you would imagine is the most typical Microsoft Enterprise Web Application.
// `;

generateDiagram("0fc60a12-6352-47da-8881-2d5873b3f7d3", description);
