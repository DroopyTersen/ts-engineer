const azureConfig = {
  instance: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
  deployment: process.env.AZURE_OPENAI_LLM_DEPLOYMENT_NAME!,
  version: process.env.AZURE_OPENAI_API_VERSION!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
};
export const azureOpenAIConfig = {
  apiKey: azureConfig.apiKey,
  baseURL: `https://${azureConfig.instance}.openai.azure.com/openai/deployments/${azureConfig.deployment}`,
  defaultQuery: { "api-version": azureConfig.version },
  defaultHeaders: { "api-key": azureConfig.apiKey },
};
