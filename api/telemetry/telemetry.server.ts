import { Langfuse } from "langfuse";
import { ConsoleTelemetry } from "./ConsoleTelemetry";
import { LangfuseTelemetry } from "./LangfuseTelemetry";
import { LLMTelemetry } from "./LLMTelemetry";
import { NoOpTelemetry } from "./NoOpTelemetry";

const DISABLE_TELEMETRY = false;
const initTelemetry = (): LLMTelemetry => {
  if (DISABLE_TELEMETRY) {
    return new NoOpTelemetry();
  }
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = process.env.LANGFUSE_URL;

  if (!secretKey || !publicKey) {
    console.warn(
      "Langfuse environment variables are missing. Falling back to ConsoleTelemetry."
    );
    return new ConsoleTelemetry();
  }

  const langfuse = new Langfuse({
    secretKey,
    publicKey,
    baseUrl,
  });
  console.log("🚀 | initTelemetry | langfuse:", langfuse.baseUrl);
  return new LangfuseTelemetry(langfuse);
};

export const telemetry = initTelemetry();
