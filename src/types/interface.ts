export interface LLMMessage {
    role: 'user' | 'assistant';
    content: string | Array<{type: string; text?: string; image_url?: {url: string}}>;
  }
