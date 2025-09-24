import type { Language, Message } from '$lib/server/db/types';

export function runPhraseSuggestionsProcessor({
    messages,
    language
}: {
    messages: Message[];
    language: Language;
}): {
    findings: Array<{
        summary: string;
        details: Record<string, unknown>;
        modality: 'text';
        targetMessageId: string;
        suggestedAction: string;
    }>;
    summary: string;
} {
    const userMessages = messages.filter((message) => message.role === 'user' && message.content.trim());
    const lastMessage = userMessages[userMessages.length - 1];

    if (!lastMessage) {
        return {
            findings: [],
            summary: 'No user messages to suggest phrasing'
        };
    }

    const suggestion = buildSuggestion(lastMessage.content, language.name);

    return {
        findings: [
            {
                summary: 'Alternative phrasing suggestion',
                details: {
                    original: lastMessage.content,
                    suggestion
                },
                modality: 'text',
                targetMessageId: lastMessage.id,
                suggestedAction: 'Show alternative phrasing'
            }
        ],
        summary: 'Generated 1 phrase suggestion'
    };
}

function buildSuggestion(original: string, languageName: string) {
    const trimmed = original.trim();
    if (trimmed.length === 0) return trimmed;
    if (trimmed.length < 20) {
        return `Could you help me practice ${languageName} by exploring "${trimmed}" in more detail?`;
    }
    return `I want to express this more naturally: "${trimmed}". Could you give a clearer phrasing in ${languageName}?`;
}
