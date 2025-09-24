import type { Message } from '$lib/server/db/types';

export function runGrammarProcessor({
    messages
}: {
    messages: Message[];
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
    const findings: Array<{
        summary: string;
        details: Record<string, unknown>;
        modality: 'text';
        targetMessageId: string;
        suggestedAction: string;
    }> = [];

    messages
        .filter((message) => message.role === 'user' && message.content.trim())
        .forEach((message) => {
            const content = message.content.trim();
            const startsLowerCase = /^[a-z]/u.test(content);
            const missingTerminalPunctuation = !/[.!?]$/u.test(content);
            const longSentence = content.split(/\s+/u).length > 25;

            if (!startsLowerCase && !missingTerminalPunctuation && !longSentence) {
                return;
            }

            const issues: string[] = [];
            if (startsLowerCase) issues.push('capitalise the sentence start');
            if (missingTerminalPunctuation) issues.push('add terminal punctuation');
            if (longSentence) issues.push('break long sentence into shorter ones');

            findings.push({
                summary: `Grammar hint: ${issues.join(', ')}`,
                details: {
                    messageContent: content,
                    issues
                },
                modality: 'text',
                targetMessageId: message.id,
                suggestedAction: 'Show grammar hint'
            });
        });

    return {
        findings,
        summary: findings.length ? `Generated ${findings.length} grammar hints` : 'No grammar hints generated'
    };
}
