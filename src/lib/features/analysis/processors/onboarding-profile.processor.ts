import type { Message, UserPreferences } from '$lib/server/db/types';

export function runOnboardingProfileProcessor({
    messages,
    preferences
}: {
    messages: Message[];
    preferences: Partial<UserPreferences>;
}): {
    findings: Array<{
        summary: string;
        details: Record<string, unknown>;
        modality: 'text';
        suggestedAction: string;
    }>;
    summary: string;
} {
    const userMessages = messages.filter((message) => message.role === 'user' && message.content.trim());
    const averageWords = userMessages.length
        ? userMessages.reduce((sum, message) => sum + message.content.split(/\s+/u).length, 0) /
              userMessages.length
        : 0;

    const estimatedLevel = estimateLevelFromAverageWords(averageWords);
    const currentLevel = preferences.speakingLevel;
    const learningGoal = preferences.learningGoal ?? 'connection';

    return {
        findings: [
            {
                summary: `Estimated onboarding level: ${estimatedLevel}`,
                details: {
                    estimatedLevel,
                    priorLevel: currentLevel,
                    recommendedFocus: learningGoal
                },
                modality: 'text',
                suggestedAction: 'Confirm profile level update'
            }
        ],
        summary: `Onboarding insight suggests ${estimatedLevel} level`
    };
}

function estimateLevelFromAverageWords(averageWords: number): 'beginner' | 'intermediate' | 'advanced' {
    if (!Number.isFinite(averageWords)) return 'beginner';
    if (averageWords < 3) return 'beginner';
    if (averageWords < 8) return 'intermediate';
    return 'advanced';
}
