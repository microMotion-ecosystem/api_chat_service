export enum MODEL {
    DEEPSEEK = 'deepseek-v3',
    GEMINI = 'gemini-1.5-flash',
    OPENAI = 'gpt-4o',
    CLAUDE = 'claude-3-5-sonnet',
}


export enum MSG_TYPE {
    USER = 'user',
    BOT = 'assistant',
}

export enum MSG_STATUS {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
}