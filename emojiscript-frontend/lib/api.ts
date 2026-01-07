// API client

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

export type TargetLanguage = "javascript";

export type SyntaxMode = "emoji" | "markup";

export interface Example {
  title: string;
  description: string;
  code: string;
  category: string;
  syntax?: SyntaxMode;
  targetLanguage?: TargetLanguage;
}

export interface TranspileRequest {
  code: string;
  targetLanguage?: TargetLanguage;
  useMarkup?: boolean;
}

export interface TranspileResponse {
  success: boolean;
  javascript?: string;
  output?: string;
  targetLanguage?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
  transpileTime?: string;
  usedMarkup?: boolean;
}

export interface SuggestionRequest {
  context: string;
  cursor: number;
}

export interface SuggestionResponse {
  success: boolean;
  suggestions: Array<{
    emoji: string;
    description: string;
    category: string;
    confidence: number;
    example?: string;
  }>;
}

export interface EmojiReference {
  success: boolean;
  reference: {
    variables: Record<string, string>;
    functions: Record<string, string>;
    control_flow: Record<string, string>;
    operators: Record<string, string>;
    io: Record<string, string>;
    data_structures: Record<string, string>;
  };
}

class APIClient {
  private baseURL: string;
  private abortController: AbortController | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = MAX_RETRIES
  ): Promise<Response> {
    try {
      this.abortController = new AbortController();
      const response = await fetch(url, {
        ...options,
        signal: this.abortController.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      return response;
    } catch (error) {
      if (
        retries > 0 &&
        error instanceof Error &&
        error.name !== "AbortError"
      ) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  abort() {
    this.abortController?.abort();
  }

  async transpile(
    code: string,
    targetLanguage: TargetLanguage = "javascript",
    useMarkup?: boolean
  ): Promise<TranspileResponse> {
    const response = await this.fetchWithRetry(`${this.baseURL}/transpile`, {
      method: "POST",
      body: JSON.stringify({ code, targetLanguage, useMarkup }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Backend unavailable" }));
      throw new Error(error.error || "Transpilation failed");
    }

    return response.json();
  }

  async validate(
    code: string
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const response = await this.fetchWithRetry(`${this.baseURL}/validate`, {
      method: "POST",
      body: JSON.stringify({ code }),
    });

    if (!response.ok) throw new Error("Validation failed");
    return response.json();
  }

  async getSuggestions(
    context: string,
    cursor: number
  ): Promise<SuggestionResponse> {
    const response = await this.fetchWithRetry(`${this.baseURL}/suggestions`, {
      method: "POST",
      body: JSON.stringify({ context, cursor }),
    });

    if (!response.ok) throw new Error("Failed to get suggestions");
    return response.json();
  }

  async getReference(): Promise<EmojiReference> {
    const response = await this.fetchWithRetry(`${this.baseURL}/reference`);
    if (!response.ok) throw new Error("Failed to get reference");
    return response.json();
  }

  async healthCheck(): Promise<{
    status: string;
    version: string;
  }> {
    const response = await this.fetchWithRetry(`${this.baseURL}/health`, {}, 0);
    if (!response.ok) throw new Error("Health check failed");
    return response.json();
  }

  async getExamples(syntaxType: SyntaxMode = "emoji"): Promise<Example[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseURL}/examples?syntax=${syntaxType}`
      );

      if (!response.ok) throw new Error("Failed to get examples");

      const data = await response.json();
      return data.map((item: any) => ({
        title: item.title,
        description: item.description,
        code: item.code,
        category: item.category || "general",
        syntax: item.syntax,
      }));
    } catch (error) {
      console.error("getExamples error:", error);
      return [];
    }
  }
}

export const apiClient = new APIClient();
