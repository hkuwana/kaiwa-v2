export function runAudioPlaceholderProcessor(): {
    findings: Array<{
        summary: string;
        details: Record<string, unknown>;
        modality: 'audio';
    }>;
    summary: string;
} {
    return {
        findings: [
            {
                summary: 'Audio analysis placeholder — hook up processors when audio pipeline lands',
                details: {
                    note: 'Stub entry to demonstrate modality separation'
                },
                modality: 'audio'
            }
        ],
        summary: 'Audio insights pending'
    };
}
