import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import request from '../request';
import { secureStorage } from '../secureStorage';
import { type CustomModelConfig, LATEST_MODELS, type SelectableModel } from './models';
import { systemInstruction } from './prompts';
import { AiUsageLogSchema, type AiUsageLog } from '../types';

export * from './commands';
export * from './models';
export * from './prompts';

/**
 * Fallback to server-side AI generation.
 */
export const aiGenerate = async (prompt: string, noteId: string) => {
  const url = `${PUBLIC_BACKEND_URL}/api/v1/ai/generate`;
  const res = await request(url, {
    method: 'POST',
    body: JSON.stringify({ prompt, note_id: noteId }),
  });
  return res;
};

/**
 * Fetch the last 10 AI usage logs for the current user by default
 * @param limit Number of logs to fetch. Default is 10.
 * @returns An array of AiUsageLogs
 */
export const getAiUsageLogs = async (limit = 10): Promise<AiUsageLog[]> => {
  const url = `${PUBLIC_BACKEND_URL}/api/v1/ai/usage?limit=${limit}`;
  const res = await request(url);
  if (!res.ok) {
    throw new Error('Failed to fetch AI usage logs');
  }
  const data = await res.json();
  return AiUsageLogSchema.array().parse(data);
};

export type AIProvider = 'server' | 'gemini' | 'openai' | 'claude' | 'deepseek' | 'kimi' | 'grok' | 'custom';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function getAllConfiguredModels(): Promise<Record<string, SelectableModel[]>> {
  if (!isTauri()) {
    return {};
  }

  const result: Record<string, SelectableModel[]> = {};

  const providers: { id: keyof typeof LATEST_MODELS; key: string }[] = [
    { id: 'gemini', key: 'gemini_api_key' },
    { id: 'openai', key: 'openai_api_key' },
    { id: 'claude', key: 'claude_api_key' },
    { id: 'deepseek', key: 'deepseek_api_key' },
    { id: 'kimi', key: 'kimi_api_key' },
    { id: 'grok', key: 'grok_api_key' },
  ];

  for (const p of providers) {
    const key = await secureStorage.getItem(p.key);
    if (key && key.trim().length > 0) {
      const providerConfig = LATEST_MODELS[p.id as keyof typeof LATEST_MODELS];
      if (providerConfig && providerConfig.models) {
        const providerModels: SelectableModel[] = [];
        for (const [mKey, mVal] of Object.entries(providerConfig.models)) {
          providerModels.push({
            id: `${p.id}:${mKey}`,
            displayName: mVal.displayName,
            provider: p.id,
            providerIcon: providerConfig.icon,
            modelString: mVal.modelString || mKey,
            contextWindow: mVal.contextWindow,
            maxOutputTokens: mVal.maxOutputTokens,
            inputCostPerMillion: mVal.inputCostPerMillion,
            outputCostPerMillion: mVal.outputCostPerMillion,
            cachedInputCostPerMillion: mVal.cachedInputCostPerMillion,
            notes: mVal.notes,
            isCustom: false,
          });
        }
        if (providerModels.length > 0) {
          result[p.id] = providerModels;
        }
      }
    }
  }

  try {
    const rawCustom = localStorage.getItem('custom_ai_models');
    if (rawCustom) {
      const customList: CustomModelConfig[] = JSON.parse(rawCustom);
      const customModels: SelectableModel[] = [];
      for (const item of customList) {
        const key = await secureStorage.getItem(`custom_${item.id}_api_key`);
        if (key && key.trim().length > 0) {
          customModels.push({
            id: item.id,
            displayName: item.displayName,
            provider: 'custom',
            modelString: item.modelString,
            contextWindow: item.contextWindow || 128_000,
            isCustom: true,
          });
        }
      }
      if (customModels.length > 0) {
        result['custom'] = customModels;
      }
    }
  } catch (e) {
    console.error('Failed to parse custom models from localStorage', e);
  }

  return result;
}

export const getAIConfig = async (): Promise<{
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}> => {
  if (!isTauri()) {
    return { provider: 'server', model: '', apiKey: '' };
  }

  const useOwnKeys = localStorage.getItem('useOwnKeys') === 'true';
  if (!useOwnKeys) {
    return { provider: 'server', model: '', apiKey: '' };
  }

  const activeModelId = localStorage.getItem('active_ai_model_id');

  if (activeModelId) {
    try {
      const rawCustom = localStorage.getItem('custom_ai_models');
      if (rawCustom) {
        const customList: import('./models').CustomModelConfig[] = JSON.parse(rawCustom);
        const found = customList.find((c) => c.id === activeModelId);
        if (found) {
          const apiKey = (await secureStorage.getItem(`custom_${found.id}_api_key`)) || '';
          return {
            provider: 'custom',
            model: found.modelString,
            apiKey,
            baseUrl: found.baseUrl,
          };
        }
      }
    } catch {}

    if (activeModelId.includes(':')) {
      const [p, mKey] = activeModelId.split(':');
      const provider = p as AIProvider;
      const apiKey = (await secureStorage.getItem(`${provider}_api_key`)) || '';
      let baseUrl: string | undefined;
      if (provider === 'deepseek') baseUrl = 'https://api.deepseek.com/v1';
      if (provider === 'kimi') baseUrl = 'https://api.moonshot.cn/v1';
      if (provider === 'grok') baseUrl = 'https://api.x.ai/v1';

      const providerConfig = LATEST_MODELS[provider as keyof typeof LATEST_MODELS];
      const modelObj = providerConfig?.models ? providerConfig.models[mKey] : null;
      const model = modelObj ? modelObj.modelString : mKey;

      return { provider, model, apiKey, baseUrl };
    }
  }

  const provider = (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
  const apiKey = (await secureStorage.getItem(`${provider}_api_key`)) || '';
  let model = localStorage.getItem(`${provider}_model`) || '';
  let baseUrl = localStorage.getItem(`${provider}_base_url`) || undefined;

  if (provider === 'gemini' && !model) model = 'gemini-3.6-flash';
  if (provider === 'openai' && !model) model = 'gpt-5.5';
  if (provider === 'claude' && !model) model = 'claude-sonnet-5';
  if (provider === 'deepseek' && !model) {
    model = 'deepseek-v4-pro';
    baseUrl = 'https://api.deepseek.com/v1';
  }
  if (provider === 'kimi' && !model) {
    model = 'kimi-k3';
    baseUrl = 'https://api.moonshot.cn/v1';
  }
  if (provider === 'grok' && !model) {
    model = 'grok-4.5';
    baseUrl = 'https://api.x.ai/v1';
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
  noteId: string,
  onChunk: (chunk: string) => void,
  onError?: (error: Error) => void
) {
  try {
    const config = await getAIConfig();

    if (config.provider === 'server') {
      const res = await aiGenerate(prompt, noteId);
      if (!res.ok) {
        let message = 'Failed to call AI';
        try {
          const data = await res.json();
          message = data?.error ?? message;
        } catch {}
        throw new Error(message);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Streaming not supported');

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

    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error(`Please set API key for ${config.provider} in settings.`);
    }

    let languageModel;

    switch (config.provider) {
      case 'gemini': {
        const google = createGoogleGenerativeAI({
          apiKey: config.apiKey,
        });
        languageModel = google(config.model);
        break;
      }
      case 'claude': {
        const anthropic = createAnthropic({ apiKey: config.apiKey });
        languageModel = anthropic(config.model);
        break;
      }
      case 'openai':
      case 'deepseek':
      case 'kimi':
      case 'grok':
      case 'custom': {
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
    const err = error instanceof Error ? error : new Error('Unknown error');
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
  baseUrl?: string
): Promise<boolean> {
  try {
    let languageModel;
    switch (provider) {
      case 'gemini': {
        const google = createGoogleGenerativeAI({ apiKey });
        languageModel = google(model || 'gemini-2.5-flash');
        break;
      }
      case 'claude': {
        const anthropic = createAnthropic({ apiKey });
        languageModel = anthropic(model || 'claude-3-5-sonnet-latest');
        break;
      }
      case 'openai':
      case 'deepseek':
      case 'kimi':
      case 'grok':
      case 'custom': {
        const openai = createOpenAI({ apiKey, baseURL: baseUrl });
        languageModel = openai(model || (provider === 'grok' ? 'grok-4.5' : 'gpt-4o-mini'));
        break;
      }
      default:
        return false;
    }

    await generateText({
      model: languageModel,
      prompt: 'Say hi',
    });

    return true;
  } catch (e) {
    console.error('API Key verification failed:', e);
    return false;
  }
}
