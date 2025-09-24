import type { Language, Message } from '$lib/server/db/types';

interface QuickStatsResult {
    totalMessages: number;
    userMessages: number;
    practiceTimeMinutes: number;
    averageWordsPerUserMessage: number;
    estimatedLevel: 'beginner' | 'intermediate' | 'advanced';
    topics: string[];
}

export function runQuickStatsProcessor({
    messages,
    language
}: {
    messages: Message[];
    language: Language;
}): {
    findings: Array<{
        summary: string;
        details: QuickStatsResult;
        modality: 'text';
    }>;
    raw: { stats: QuickStatsResult };
} {
    const displayMessages = messages.filter((message) => {
        if (!message.content) return false;
        const trimmed = message.content.trim();
        if (trimmed.length === 0) return false;
        if (trimmed.includes('[Speaking...]')) return false;
        if (trimmed.includes('[Transcribing...]')) return false;
        return true;
    });

    const userMessages = displayMessages.filter((message) => message.role === 'user');
    const totalMessages = displayMessages.length;
    const userMessageCount = userMessages.length;
    const practiceTimeMinutes = displayMessages.length
        ? Math.max(
              0,
              Math.round(
                  ((displayMessages[displayMessages.length - 1].timestamp?.getTime?.() ?? Date.now()) -
                      (displayMessages[0].timestamp?.getTime?.() ?? Date.now())) /
                      60000
              )
          )
        : 0;

    const averageWords = userMessageCount
        ? userMessages.reduce((sum, message) => sum + message.content.split(/\s+/u).length, 0) /
              userMessageCount
        : 0;

    const estimatedLevel = estimateLevelFromAverageWords(averageWords);
    const topics = extractTopics(
        userMessages
            .map((message) => message.content)
            .join(' ')
            .toLowerCase()
    );

    const stats: QuickStatsResult = {
        totalMessages,
        userMessages: userMessageCount,
        practiceTimeMinutes,
        averageWordsPerUserMessage: Number.isFinite(averageWords) ? Number(averageWords.toFixed(2)) : 0,
        estimatedLevel,
        topics
    };

    return {
        findings: [
            {
                summary: `Detected ${userMessageCount} user messages across ${totalMessages} total exchanges in ${language.name}. Estimated level: ${estimatedLevel}.`,
                details: stats,
                modality: 'text'
            }
        ],
        raw: { stats }
    };
}

function estimateLevelFromAverageWords(averageWords: number): QuickStatsResult['estimatedLevel'] {
    if (!Number.isFinite(averageWords)) return 'beginner';
    if (averageWords < 3) return 'beginner';
    if (averageWords < 8) return 'intermediate';
    return 'advanced';
}

function extractTopics(content: string) {
    const topicKeywords = [
        'work',
        'job',
        'career',
        'business',
        'meeting',
        'travel',
        'vacation',
        'trip',
        'hotel',
        'flight',
        'food',
        'restaurant',
        'cooking',
        'family',
        'friends',
        'hobby',
        'sport',
        'music',
        'movie',
        'shopping',
        'health'
    ];

    return topicKeywords.filter((keyword) => content.includes(keyword)).slice(0, 5);
}
