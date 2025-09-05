// Type declarations for kuroshiro and kuroshiro-analyzer-kuromoji
declare module 'kuroshiro' {
	interface KuroshiroOptions {
		to: 'hiragana' | 'katakana' | 'romaji';
		mode?: 'furigana' | 'okurigana' | 'spaced' | 'normal';
		romajiSystem?: 'nippon' | 'passport' | 'hepburn';
		delimiter_start?: string;
		delimiter_end?: string;
	}

	class Kuroshiro {
		init(analyzer: any): Promise<void>;
		convert(text: string, options: KuroshiroOptions): Promise<string>;
	}

	export default Kuroshiro;
}

declare module 'kuroshiro-analyzer-kuromoji' {
	interface KuromojiAnalyzerOptions {
		dictPath?: string;
	}

	class KuromojiAnalyzer {
		constructor(options?: KuromojiAnalyzerOptions);
	}

	export default KuromojiAnalyzer;
}
