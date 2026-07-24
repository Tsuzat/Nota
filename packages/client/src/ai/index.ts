import { streamText, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { secureStorage } from "../secureStorage";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import request from "../request";
import { systemInstruction } from "./prompts";

export * from "./prompts";
export * from "./commands";

/**
 * Fallback to server-side AI generation.
 */
export const aiGenerate = async (prompt: string) => {
  const url = `${PUBLIC_BACKEND_URL}/api/v1/ai/generate`;
  const res = await request(url, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
  return res;
};

export type AIProvider =
  | "server"
  | "gemini"
  | "openai"
  | "claude"
  | "deepseek"
  | "kimi"
  | "custom";

export const getAIConfig = async (): Promise<{
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}> => {
  const provider =
    (localStorage.getItem("ai_provider") as AIProvider) || "server";
  if (provider === "server") {
    return { provider, model: "", apiKey: "" };
  }

  const apiKey = (await secureStorage.getItem(`${provider}_api_key`)) || "";
  let model = localStorage.getItem(`${provider}_model`) || "";
  let baseUrl = localStorage.getItem(`${provider}_base_url`) || undefined;

  // Defaults for well-known providers
  if (provider === "gemini" && !model) model = "gemini-2.5-flash";
  if (provider === "openai" && !model) model = "gpt-4o-mini";
  if (provider === "claude" && !model) model = "claude-3-5-sonnet-latest";
  if (provider === "deepseek" && !model) {
    model = "deepseek-chat";
    baseUrl = "https://api.deepseek.com/v1";
  }
  if (provider === "kimi" && !model) {
    model = "moonshot-v1-8k";
    baseUrl = "https://api.moonshot.cn/v1";
  }

  return { provider, model, apiKey, baseUrl };
};

/**
 * Calls the AI model to generate a streaming response.
 *
 * @param prompt - The input prompt to send to the model.
 * @param onChunk - Callback invoked with each text chunk as it arrives.
 * @param onError - Optional callback invoked if an error occurs during generation.
 */
export async function callAI(
  prompt: string,
  onChunk: (chunk: string) => void,
  onError?: (error: Error) => void,
) {
  try {
    const config = await getAIConfig();

    if (config.provider === "server") {
      const res = await aiGenerate(prompt);
      if (!res.ok) {
        let message = "Failed to call AI";
        try {
          const data = await res.json();
          message = data?.error ?? message;
        } catch {}
        throw new Error(message);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming not supported");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          const text = decoder.decode(value, { stream: true });
          if (text) onChunk(text);
        }
      }
      return;
    }

    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new Error(`Please set API key for ${config.provider} in settings.`);
    }

    let languageModel;

    switch (config.provider) {
      case "gemini": {
        const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
        languageModel = google(config.model);
        break;
      }
      case "claude": {
        const anthropic = createAnthropic({ apiKey: config.apiKey });
        languageModel = anthropic(config.model);
        break;
      }
      case "openai":
      case "deepseek":
      case "kimi":
      case "custom": {
        const openai = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseUrl,
        });
        languageModel = openai(config.model);
        break;
      }
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    const { textStream } = streamText({
      model: languageModel,
      system: systemInstruction,
      prompt,
    });

    for await (const textPart of textStream) {
      onChunk(textPart);
    }
  } catch (error) {
    console.error(error);
    const err = error instanceof Error ? error : new Error("Unknown error");
    onError?.(err);
  }
}

/**
 * Utility to verify if an API key is valid.
 */
export async function testAIKey(
  provider: AIProvider,
  apiKey: string,
  model: string,
  baseUrl?: string,
): Promise<boolean> {
  try {
    let languageModel;
    switch (provider) {
      case "gemini": {
        const google = createGoogleGenerativeAI({ apiKey });
        languageModel = google(model || "gemini-2.5-flash");
        break;
      }
      case "claude": {
        const anthropic = createAnthropic({ apiKey });
        languageModel = anthropic(model || "claude-3-5-sonnet-latest");
        break;
      }
      case "openai":
      case "deepseek":
      case "kimi":
      case "custom": {
        const openai = createOpenAI({ apiKey, baseURL: baseUrl });
        languageModel = openai(model || "gpt-4o-mini");
        break;
      }
      default:
        return false;
    }

    await generateText({
      model: languageModel,
      prompt: "Say hi",
    });

    return true;
  } catch (e) {
    console.error("API Key verification failed:", e);
    return false;
  }
}
