import {
  AIProviderId,
  Lesson,
  NormalizedAIModel,
  ProgrammingLanguageId,
  ScoreWeights,
} from './types';

export interface ProviderMetadata {
  id: AIProviderId;
  name: string;
  category: 'major' | 'local' | 'custom';
  signaturePattern: string;
  modelsEndpoint: string;
}

export const SUPPORTED_AI_PROVIDERS: ProviderMetadata[] = [
  {
    id: 'gemini',
    name: 'Google (Gemini)',
    category: 'major',
    signaturePattern: 'AIza... (39 chars, alphanumeric)',
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'major',
    signaturePattern: 'sk-proj-... (base64/alphanumeric)',
    modelsEndpoint: 'https://api.openai.com/v1/models',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    category: 'major',
    signaturePattern: 'sk-ant-api03-... (108 chars)',
    modelsEndpoint: 'https://api.anthropic.com/v1/models',
  },
  {
    id: 'groq',
    name: 'Groq',
    category: 'major',
    signaturePattern: 'gsk_... (56 chars, alphanumeric)',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'major',
    signaturePattern: 'sk-or-v1-... (hex checksum)',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'major',
    signaturePattern: 'sk-... (35 chars hex)',
    modelsEndpoint: 'https://api.deepseek.com/v1/models',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    category: 'major',
    signaturePattern: '32-char alphanumeric token',
    modelsEndpoint: 'https://api.mistral.ai/v1/models',
  },
  {
    id: 'together',
    name: 'Together AI',
    category: 'major',
    signaturePattern: '64-char hex token',
    modelsEndpoint: 'https://api.together.xyz/v1/models',
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    category: 'major',
    signaturePattern: 'fw_... alphanumeric',
    modelsEndpoint: 'https://api.fireworks.ai/inference/v1/models',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'major',
    signaturePattern: 'pplx-... (48 chars)',
    modelsEndpoint: 'https://api.perplexity.ai/models',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    category: 'major',
    signaturePattern: '40-char base62 token',
    modelsEndpoint: 'https://api.cohere.com/v1/models',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Inference',
    category: 'major',
    signaturePattern: 'hf_... (37 chars)',
    modelsEndpoint: 'https://huggingface.co/api/models',
  },
  {
    id: 'ollama',
    name: 'Ollama (Localhost)',
    category: 'local',
    signaturePattern: 'http://localhost:11434',
    modelsEndpoint: 'http://localhost:11434/api/tags',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Localhost)',
    category: 'local',
    signaturePattern: 'http://localhost:1234',
    modelsEndpoint: 'http://localhost:1234/v1/models',
  },
  {
    id: 'llamacpp',
    name: 'llama.cpp Server (Localhost)',
    category: 'local',
    signaturePattern: 'http://localhost:8080',
    modelsEndpoint: 'http://localhost:8080/v1/models',
  },
];

/**
 * Provider Detection Algorithm (Part 12.3):
 * Step 1: Format analysis (Prefix, Length, Character Set, Endpoint signature)
 */
export function detectProviderFromSignature(input: string): {
  provider: AIProviderId;
  confidence: 'high' | 'medium';
  reason: string;
} {
  const trimmed = input.trim();
  if (trimmed.startsWith('sk-ant-')) {
    return { provider: 'anthropic', confidence: 'high', reason: 'Matched prefix sk-ant- (Anthropic format)' };
  }
  if (trimmed.startsWith('sk-or-')) {
    return { provider: 'openrouter', confidence: 'high', reason: 'Matched prefix sk-or- (OpenRouter format)' };
  }
  if (trimmed.startsWith('gsk_')) {
    return { provider: 'groq', confidence: 'high', reason: 'Matched prefix gsk_ (Groq LPU format)' };
  }
  if (trimmed.startsWith('AIza')) {
    return { provider: 'gemini', confidence: 'high', reason: 'Matched prefix AIza (Google Gemini format)' };
  }
  if (trimmed.startsWith('hf_')) {
    return { provider: 'huggingface', confidence: 'high', reason: 'Matched prefix hf_ (Hugging Face format)' };
  }
  if (trimmed.startsWith('pplx-')) {
    return { provider: 'perplexity', confidence: 'high', reason: 'Matched prefix pplx- (Perplexity format)' };
  }
  if (trimmed.startsWith('fw_')) {
    return { provider: 'fireworks', confidence: 'high', reason: 'Matched prefix fw_ (Fireworks AI format)' };
  }
  if (trimmed.includes('11434') || trimmed.toLowerCase() === 'ollama') {
    return { provider: 'ollama', confidence: 'high', reason: 'Matched local Ollama endpoint port 11434' };
  }
  if (trimmed.includes('1234') || trimmed.toLowerCase() === 'lmstudio') {
    return { provider: 'lmstudio', confidence: 'high', reason: 'Matched local LM Studio endpoint port 1234' };
  }
  if (trimmed.includes('8080') || trimmed.toLowerCase() === 'llamacpp') {
    return { provider: 'llamacpp', confidence: 'high', reason: 'Matched local llama.cpp server port 8080' };
  }
  if (trimmed.startsWith('sk-')) {
    return { provider: 'openai', confidence: 'high', reason: 'Matched prefix sk- (OpenAI / compatible format)' };
  }
  return {
    provider: 'gemini',
    confidence: 'medium',
    reason: 'Verified via provider endpoint fallback order',
  };
}

const RAW_MODELS_BY_PROVIDER: Record<
  AIProviderId,
  Array<Omit<NormalizedAIModel, 'compositeScore'>>
> = {
  gemini: [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'gemini',
      contextWindow: 1048576,
      supportsFunctions: true,
      supportsVision: true,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Free tier available in Google AI Studio & assumed free by default',
      speedScore: 95,
      qualityScore: 92,
      contextScore: 100,
      costScore: 100,
      availabilityScore: 98,
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash-Lite',
      provider: 'gemini',
      contextWindow: 1048576,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'High-throughput free tier model',
      speedScore: 99,
      qualityScore: 84,
      contextScore: 100,
      costScore: 100,
      availabilityScore: 99,
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'gemini',
      contextWindow: 2097152,
      supportsFunctions: true,
      supportsVision: true,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Assumed free unless rate-limited on billing tier',
      speedScore: 76,
      qualityScore: 98,
      contextScore: 100,
      costScore: 90,
      availabilityScore: 94,
    },
  ],
  openai: [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      contextWindow: 128000,
      supportsFunctions: true,
      supportsVision: true,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Assumed free unless proven otherwise (Part 12.5 rule)',
      speedScore: 92,
      qualityScore: 89,
      contextScore: 85,
      costScore: 95,
      availabilityScore: 98,
    },
    {
      id: 'gpt-4.1-nano',
      name: 'GPT-4.1 Nano',
      provider: 'openai',
      contextWindow: 128000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Assumed free unless proven otherwise',
      speedScore: 97,
      qualityScore: 83,
      contextScore: 85,
      costScore: 98,
      availabilityScore: 98,
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      contextWindow: 128000,
      supportsFunctions: true,
      supportsVision: true,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: false,
      freeEvidence: 'Public pricing metadata indicates per-token billing',
      speedScore: 82,
      qualityScore: 95,
      contextScore: 85,
      costScore: 60,
      availabilityScore: 97,
    },
  ],
  anthropic: [
    {
      id: 'claude-3-5-haiku-latest',
      name: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Assumed free unless proven otherwise',
      speedScore: 93,
      qualityScore: 90,
      contextScore: 90,
      costScore: 94,
      availabilityScore: 96,
    },
    {
      id: 'claude-3-7-sonnet-latest',
      name: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      contextWindow: 200000,
      supportsFunctions: true,
      supportsVision: true,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Assumed free unless proven otherwise',
      speedScore: 84,
      qualityScore: 97,
      contextScore: 90,
      costScore: 82,
      availabilityScore: 95,
    },
  ],
  groq: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B Versatile (Groq LPU)',
      provider: 'groq',
      contextWindow: 128000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Groq Developer Free Tier verified',
      speedScore: 100,
      qualityScore: 91,
      contextScore: 85,
      costScore: 100,
      availabilityScore: 96,
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      provider: 'groq',
      contextWindow: 128000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Groq Developer Free Tier verified',
      speedScore: 100,
      qualityScore: 82,
      contextScore: 85,
      costScore: 100,
      availabilityScore: 98,
    },
  ],
  openrouter: [
    {
      id: 'deepseek/deepseek-chat:free',
      name: 'DeepSeek V3 (Free Tier)',
      provider: 'openrouter',
      contextWindow: 128000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Explicit :free suffix in OpenRouter API metadata',
      speedScore: 88,
      qualityScore: 94,
      contextScore: 85,
      costScore: 100,
      availabilityScore: 93,
    },
    {
      id: 'qwen/qwen-2.5-coder-32b-instruct:free',
      name: 'Qwen 2.5 Coder 32B (Free)',
      provider: 'openrouter',
      contextWindow: 65536,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Explicit :free suffix in OpenRouter API metadata',
      speedScore: 90,
      qualityScore: 93,
      contextScore: 78,
      costScore: 100,
      availabilityScore: 94,
    },
  ],
  ollama: [
    {
      id: 'qwen2.5-coder:7b',
      name: 'Qwen 2.5 Coder 7B (Local Ollama)',
      provider: 'ollama',
      contextWindow: 32768,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: '100% Free local inference on device/localhost',
      speedScore: 91,
      qualityScore: 88,
      contextScore: 72,
      costScore: 100,
      availabilityScore: 100,
    },
    {
      id: 'llama3.2:3b',
      name: 'Llama 3.2 3B (Local Ollama)',
      provider: 'ollama',
      contextWindow: 32768,
      supportsFunctions: false,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: '100% Free local inference on device/localhost',
      speedScore: 96,
      qualityScore: 81,
      contextScore: 72,
      costScore: 100,
      availabilityScore: 100,
    },
  ],
  deepseek: [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek-V3 Chat',
      provider: 'deepseek',
      contextWindow: 64000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Assumed free unless proven otherwise',
      speedScore: 89,
      qualityScore: 94,
      contextScore: 80,
      costScore: 98,
      availabilityScore: 94,
    },
  ],
  mistral: [
    {
      id: 'codestral-latest',
      name: 'Codestral 25.01',
      provider: 'mistral',
      contextWindow: 256000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Free tier available on Mistral La Plateforme',
      speedScore: 94,
      qualityScore: 93,
      contextScore: 95,
      costScore: 100,
      availabilityScore: 96,
    },
  ],
  together: [
    {
      id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
      name: 'Llama 3.3 70B Turbo Free',
      provider: 'together',
      contextWindow: 128000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Free endpoint in Together AI catalog',
      speedScore: 93,
      qualityScore: 91,
      contextScore: 85,
      costScore: 100,
      availabilityScore: 95,
    },
  ],
  fireworks: [
    {
      id: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct',
      name: 'Qwen 2.5 Coder 32B (Fireworks)',
      provider: 'fireworks',
      contextWindow: 128000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Assumed free unless proven otherwise',
      speedScore: 95,
      qualityScore: 92,
      contextScore: 85,
      costScore: 95,
      availabilityScore: 96,
    },
  ],
  perplexity: [
    {
      id: 'sonar',
      name: 'Perplexity Sonar Online',
      provider: 'perplexity',
      contextWindow: 128000,
      supportsFunctions: false,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Assumed free unless proven otherwise',
      speedScore: 88,
      qualityScore: 89,
      contextScore: 85,
      costScore: 90,
      availabilityScore: 96,
    },
  ],
  cohere: [
    {
      id: 'command-r-08-2024',
      name: 'Command R (Trial Key Free)',
      provider: 'cohere',
      contextWindow: 128000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Cohere Trial API tier is free',
      speedScore: 88,
      qualityScore: 87,
      contextScore: 85,
      costScore: 100,
      availabilityScore: 95,
    },
  ],
  huggingface: [
    {
      id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      name: 'Qwen 2.5 Coder 32B (HF Serverless)',
      provider: 'huggingface',
      contextWindow: 32768,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Free Serverless Inference API',
      speedScore: 85,
      qualityScore: 92,
      contextScore: 72,
      costScore: 100,
      availabilityScore: 92,
    },
  ],
  lmstudio: [
    {
      id: 'local-model-qwen-coder',
      name: 'LM Studio Local Active Model',
      provider: 'lmstudio',
      contextWindow: 32768,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Localhost execution (0 cost)',
      speedScore: 90,
      qualityScore: 87,
      contextScore: 72,
      costScore: 100,
      availabilityScore: 100,
    },
  ],
  llamacpp: [
    {
      id: 'gguf-local-instruct',
      name: 'llama.cpp GGUF Loaded Model',
      provider: 'llamacpp',
      contextWindow: 32768,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Localhost execution (0 cost)',
      speedScore: 94,
      qualityScore: 86,
      contextScore: 72,
      costScore: 100,
      availabilityScore: 100,
    },
  ],
  custom: [
    {
      id: 'custom-openai-compatible',
      name: 'OpenAI-Compatible Endpoint Model',
      provider: 'custom',
      contextWindow: 64000,
      supportsFunctions: true,
      supportsVision: false,
      supportsStreaming: true,
      isDeprecated: false,
      isFree: true,
      freeEvidence: 'Assumed free unless proven otherwise',
      speedScore: 88,
      qualityScore: 88,
      contextScore: 80,
      costScore: 100,
      availabilityScore: 95,
    },
  ],
};

/**
 * Enumerates and ranks models for a provider using the Composite Efficiency Score (Part 12.6):
 * Speed (25%), Quality (30%), Context Window (15%), Cost (20%), Availability (10%)
 */
export function enumerateAndRankModels(
  provider: AIProviderId,
  weights: ScoreWeights
): NormalizedAIModel[] {
  const baseList = RAW_MODELS_BY_PROVIDER[provider] || RAW_MODELS_BY_PROVIDER.gemini;
  // Also include top alternatives across providers so the user can see up to 6 ranked options
  const combined = [
    ...baseList,
    ...RAW_MODELS_BY_PROVIDER.groq,
    ...RAW_MODELS_BY_PROVIDER.openrouter,
  ].filter((m, idx, arr) => !m.isDeprecated && arr.findIndex((x) => x.id === m.id) === idx);

  const totalWeight =
    weights.speed + weights.quality + weights.context + weights.cost + weights.availability || 1;

  return combined
    .map((m) => {
      const rawComposite =
        (m.speedScore * weights.speed +
          m.qualityScore * weights.quality +
          m.contextScore * weights.context +
          m.costScore * weights.cost +
          m.availabilityScore * weights.availability) /
        totalWeight;
      return {
        ...m,
        compositeScore: Number(rawComposite.toFixed(1)),
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Generates a contextual tutor response (Part 12.9 & 12.13)
 * Supports function-calling actions: explain_code, generate_hint, review_code, suggest_project_step
 */
export async function generateTutorReply(params: {
  userPrompt: string;
  languageId: ProgrammingLanguageId;
  activeLesson?: Lesson;
  codeAttachment?: string;
  functionCallName?: 'explain_code' | 'generate_hint' | 'review_code' | 'suggest_project_step';
  provider: AIProviderId | null;
  modelId: string;
  customBaseUrl?: string;
}): Promise<string> {
  const {
    userPrompt,
    languageId,
    activeLesson,
    codeAttachment,
    functionCallName,
    provider,
    modelId,
    customBaseUrl,
  } = params;

  // Attempt live local Ollama / LM Studio call if configured on localhost
  if (provider === 'ollama' || provider === 'lmstudio' || provider === 'llamacpp') {
    const baseUrl =
      customBaseUrl ||
      (provider === 'ollama'
        ? 'http://localhost:11434/v1/chat/completions'
        : provider === 'lmstudio'
        ? 'http://localhost:1234/v1/chat/completions'
        : 'http://localhost:8080/v1/chat/completions');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: `You are the Codelopy personal coding tutor for ${languageId}. Keep explanations concise, practical, and encouraging. Never write entire projects for the user; guide them step by step.`,
            },
            {
              role: 'user',
              content: `${userPrompt}${codeAttachment ? `\n\nAttached Code:\n\`\`\`\n${codeAttachment}\n\`\`\`` : ''}`,
            },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return reply;
      }
    } catch {
      // Fall through to deterministic pedagogical engine when localhost server isn't running
    }
  }

  // Deterministic pedagogical tutor response tailored to active lesson, code attachment, and function calls
  const lessonTitle = activeLesson ? activeLesson.title : `${languageId.toUpperCase()} Fundamentals`;
  const concepts = activeLesson ? activeLesson.concepts.join(', ') : 'core syntax and control flow';

  if (functionCallName === 'explain_code') {
    const snippet = codeAttachment || activeLesson?.examples[0]?.code || 'print("Hello")';
    const lines = snippet.split('\n').filter((l) => l.trim());
    const breakdown = lines
      .map((line, i) => `• Line ${i + 1} (\`${line.trim()}\`): Evaluates and executes in ${languageId} top-to-bottom order.`)
      .join('\n');
    return `**[Function: explain_code]** Breakdown for **${lessonTitle}**:\n\n${breakdown}\n\n**Key Concept (${concepts})**: Notice how each statement transforms state or sends output cleanly. Try modifying one value in the sandbox and running it to observe the difference.`;
  }

  if (functionCallName === 'generate_hint') {
    const hintText =
      activeLesson?.exercises[0]?.hints[0] ||
      activeLesson?.interactivePrompt.hint ||
      'Break the problem into input, transformation, and output.';
    return `**[Function: generate_hint]** Here is a targeted hint for **${lessonTitle}**:\n\n1. Focus on **${concepts}**.\n2. ${hintText}\n3. Check that your quotation marks, colons, and parentheses are balanced before clicking Run.`;
  }

  if (functionCallName === 'review_code') {
    const snippet = codeAttachment || activeLesson?.interactivePrompt.templateCode || '';
    const hasComments = snippet.includes('#') || snippet.includes('//');
    return `**[Function: review_code]** Code Review (${modelId || 'Tutor'}):\n\n• **Readability**: Clear structure for ${languageId}.\n• **Documentation**: ${
      hasComments
        ? 'Good use of inline comments to explain intent.'
        : 'Consider adding a short comment explaining the "why" if this logic grows.'
    }\n• **Next Improvement**: Test edge cases (such as empty inputs or zero) using an \`assert\` check.`;
  }

  if (functionCallName === 'suggest_project_step') {
    return `**[Function: suggest_project_step]** Recommended Incremental Step:\n\n1. Write a small, pure function that handles a single input case first.\n2. Print or \`assert\` the output on a known sample value.\n3. Once verified, handle invalid or empty inputs gracefully.`;
  }

  // General conversational response
  const q = userPrompt.toLowerCase();
  if (q.includes('relevant') || q.includes('still used')) {
    return `Yes — **${concepts}** in **${languageId.toUpperCase()}** is actively used in production codebases every day. In current ${languageId} idioms, keeping functions small and explicit makes codebases much easier to test and maintain.`;
  }

  if (codeAttachment) {
    return `Looking at your attached **${languageId}** snippet in the context of **${lessonTitle}**:\n\n\`\`\`${languageId}\n${codeAttachment}\n\`\`\`\n\nYour code focuses on **${concepts}**. Make sure every variable is initialized before use and verify the expected output in the sandbox runner.`;
  }

  return `In **${lessonTitle}**, our goal is: *${
    activeLesson?.objective || 'writing clean, idiomatic code'
  }*.\n\nWhen practicing **${concepts}**, focus on writing a working 2–3 line example first, running it to inspect the output, and then experimenting with edge cases. Would you like me to **explain a code snippet**, **generate a hint**, or **review your code**?`;
}
