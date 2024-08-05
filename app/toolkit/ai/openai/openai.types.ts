import { OpenAI } from "openai";

export namespace OpenAITypes {
  export type ChatParams = OpenAI.Chat.ChatCompletionCreateParams;
  export type ChatMessage = ChatParams["messages"][number];

  export type SystemMessage = OpenAI.ChatCompletionSystemMessageParam;
  export type AssistantMessage = OpenAI.ChatCompletionAssistantMessageParam;
  export type UserMessage = OpenAI.ChatCompletionUserMessageParam;
  export type ToolResultMessage = OpenAI.ChatCompletionToolMessageParam;

  export type RunToolsInput = Parameters<
    OpenAI.Beta.Chat.Completions["runTools"]
  >[0];
  type RunnableTools = (RunToolsInput & { stream: true })["tools"];
  export type RunnableTool = RunnableTools[number];
  export type RunnableToolWithDefinitionId = RunnableTool & {
    toolDefinitionId: string;
  };

  export type ToolsRunner = ReturnType<
    OpenAI.Beta.Chat.Completions["runTools"]
  >;

  export type ToolsRunnerEvent = Parameters<ToolsRunner["on"]>[0];

  export type ToolCallMessage = OpenAI.ChatCompletionMessageToolCall;
}
