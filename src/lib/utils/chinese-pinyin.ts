// 🇨🇳 Lightweight Client-Side Chinese Pinyin
// Basic pinyin conversion for common Chinese characters

// Common Chinese characters to pinyin mapping
const PINYIN_MAP: Record<string, string> = {
	// Common greetings and basic words
	你: 'ni',
	好: 'hao',
	我: 'wo',
	是: 'shi',
	的: 'de',
	了: 'le',
	不: 'bu',
	在: 'zai',
	有: 'you',
	个: 'ge',
	人: 'ren',
	这: 'zhe',
	中: 'zhong',
	大: 'da',
	为: 'wei',
	上: 'shang',
	们: 'men',
	到: 'dao',
	说: 'shuo',
	国: 'guo',
	年: 'nian',
	着: 'zhe',
	就: 'jiu',
	那: 'na',
	和: 'he',
	要: 'yao',
	她: 'ta',
	出: 'chu',
	也: 'ye',
	得: 'de',
	里: 'li',
	后: 'hou',
	自: 'zi',
	以: 'yi',
	会: 'hui',
	家: 'jia',
	可: 'ke',
	下: 'xia',
	而: 'er',
	过: 'guo',

	// Numbers
	一: 'yi',
	二: 'er',
	三: 'san',
	四: 'si',
	五: 'wu',
	六: 'liu',
	七: 'qi',
	八: 'ba',
	九: 'jiu',
	十: 'shi',
	零: 'ling',
	百: 'bai',
	千: 'qian',
	万: 'wan',

	// Time and dates
	今: 'jin',
	天: 'tian',
	日: 'ri',
	月: 'yue',
	时: 'shi',
	分: 'fen',
	秒: 'miao',
	早: 'zao',
	晚: 'wan',
	午: 'wu',
	点: 'dian',

	// Common verbs
	吃: 'chi',
	喝: 'he',
	睡: 'shui',
	走: 'zou',
	来: 'lai',
	去: 'qu',
	看: 'kan',
	听: 'ting',
	读: 'du',
	写: 'xie',
	学: 'xue',
	习: 'xi',
	工: 'gong',
	作: 'zuo',
	买: 'mai',
	卖: 'mai',
	开: 'kai',
	关: 'guan',
	给: 'gei',

	// Weather
	气: 'qi',
	很: 'hen',
	热: 're',
	冷: 'leng',
	雨: 'yu',
	雪: 'xue',
	风: 'feng',
	云: 'yun',
	晴: 'qing',

	// Places and directions
	北: 'bei',
	京: 'jing',
	海: 'hai',
	广: 'guang',
	州: 'zhou',
	深: 'shen',
	圳: 'zhen',
	南: 'nan',
	西: 'xi',
	东: 'dong',
	外: 'wai',
	内: 'nei',
	前: 'qian',
	左: 'zuo',
	右: 'you',
	旁: 'pang',
	边: 'bian',

	// Family
	父: 'fu',
	母: 'mu',
	儿: 'er',
	女: 'nv',
	子: 'zi',
	哥: 'ge',
	弟: 'di',
	姐: 'jie',
	妹: 'mei',
	爱: 'ai',

	// Colors
	红: 'hong',
	黄: 'huang',
	蓝: 'lan',
	绿: 'lv',
	白: 'bai',
	黑: 'hei',
	灰: 'hui',
	紫: 'zi',
	粉: 'fen',
	橙: 'cheng',

	// Common phrases
	谢: 'xie',
	请: 'qing',
	对: 'dui',
	起: 'qi',
	没: 'mei',
	系: 'xi',
	再: 'zai',
	见: 'jian',
	欢: 'huan',
	迎: 'ying',
	光: 'guang',
	临: 'lin',

	// School and learning
	校: 'xiao',
	老: 'lao',
	师: 'shi',
	同: 'tong',
	生: 'sheng',
	书: 'shu',
	文: 'wen',
	语: 'yu',
	言: 'yan',
	英: 'ying',
	法: 'fa',
	德: 'de',

	// Food
	饭: 'fan',
	菜: 'cai',
	肉: 'rou',
	鱼: 'yu',
	蛋: 'dan',
	奶: 'nai',
	茶: 'cha',
	咖: 'ka',
	啡: 'fei',
	水: 'shui',
	面: 'mian',
	包: 'bao',
	饺: 'jiao',
	汤: 'tang',
	米: 'mi',

	// Transportation
	车: 'che',
	船: 'chuan',
	飞: 'fei',
	机: 'ji',
	火: 'huo',
	地: 'di',
	铁: 'tie',
	公: 'gong',
	交: 'jiao',
	站: 'zhan',

	// Technology
	电: 'dian',
	脑: 'nao',
	话: 'hua',
	网: 'wang',
	络: 'luo',
	器: 'qi',
	视: 'shi',
	频: 'pin',
	音: 'yin',
	乐: 'yue',
	游: 'you',
	戏: 'xi',

	// Money and shopping
	钱: 'qian',
	块: 'kuai',
	元: 'yuan',
	角: 'jiao',
	商: 'shang',
	店: 'dian',
	市: 'shi',
	场: 'chang',
	价: 'jia',
	格: 'ge',
	便: 'pian',
	宜: 'yi',
	贵: 'gui',

	// Body parts
	头: 'tou',
	眼: 'yan',
	睛: 'jing',
	鼻: 'bi',
	嘴: 'zui',
	手: 'shou',
	脚: 'jiao',
	身: 'shen',
	体: 'ti',
	心: 'xin',

	// Common adjectives
	坏: 'huai',
	新: 'xin',
	旧: 'jiu',
	多: 'duo',
	少: 'shao',
	高: 'gao',
	矮: 'ai',
	胖: 'pang',
	瘦: 'shou',
	快: 'kuai',
	慢: 'man',
	远: 'yuan',
	近: 'jin',
	长: 'chang',
	短: 'duan',
	宽: 'kuan',
	窄: 'zhai',
	浅: 'qian',

	// Additional common characters
	首: 'shou',
	都: 'du',
	喜: 'xi',
	意: 'yi',
	思: 'si',
	想: 'xiang',
	知: 'zhi',
	道: 'dao',
	问: 'wen',
	题: 'ti',
	答: 'da',
	案: 'an',
	感: 'gan',
	觉: 'jue',
	真: 'zhen',
	错: 'cuo',
	帮: 'bang',
	助: 'zhu',
	需: 'xu',

	// Question words and common phrases
	怎: 'zen',
	么: 'me',
	样: 'yang',
	什: 'shen',
	哪: 'na',
	谁: 'shei',
	什么: 'shenme',
	怎么: 'zenme',
	怎样: 'zenyang',
	几: 'ji',
	哪里: 'nali',
	什么时候: 'shenmeshihou',

	// More verbs and adjectives
	做: 'zuo',
	用: 'yong',
	让: 'rang',
	叫: 'jiao',
	找: 'zhao',
	告: 'gao',
	诉: 'su',
	拿: 'na',
	放: 'fang',
	带: 'dai',
	送: 'song',
	收: 'shou',
	打: 'da',
	拉: 'la',
	推: 'tui',
	举: 'ju',
	抱: 'bao'
};

// Tone marks mapping for enhanced display

/**
 * Check if a character is Chinese (improved to avoid Japanese interference)
 */
export function isChinese(char: string): boolean {
	const code = char.charCodeAt(0);

	// First check if it's in CJK Unified Ideographs range
	const isCJK =
		(code >= 0x4e00 && code <= 0x9fff) ||
		(code >= 0x3400 && code <= 0x4dbf) ||
		(code >= 0x20000 && code <= 0x2a6df);

	if (!isCJK) return false;

	// Exclude Japanese-specific ranges if we're being strict
	// For single character checking, we'll be permissive and let context handle it
	return true;
}

/**
 * Check if text contains Chinese characters (improved detection)
 */
export function isChineseText(text: string): boolean {
	if (!text) return false;

	// Check for CJK ideographs
	const hasCJK = /[\u4E00-\u9FAF]/.test(text);
	if (!hasCJK) return false;

	// If there are uniquely Japanese characters, it's not Chinese
	const hasHiragana = /[\u3040-\u309F]/.test(text);
	const hasKatakana = /[\u30A0-\u30FF]/.test(text);

	if (hasHiragana || hasKatakana) {
		return false;
	}

	// Otherwise, treat CJK characters as Chinese by default
	return true;
}

/**
 * Convert a single Chinese character to pinyin
 */
export function charToPinyin(char: string): string {
	// Check our dictionary first
	if (PINYIN_MAP[char]) {
		return PINYIN_MAP[char];
	}

	// For unknown characters, return the original character
	// In a more complete implementation, this could fall back to
	// other methods or APIs
	return char;
}

/**
 * Basic pinyin conversion for Chinese text
 */
export function pinyinize(
	text: string,
	options: {
		withTones?: boolean;
		separator?: string;
	} = {}
): string {
	const { separator = ' ' } = options;

	if (!text || typeof text !== 'string') {
		return '';
	}

	let result = '';
	let pinyinParts: string[] = [];

	for (let i = 0; i < text.length; i++) {
		const char = text[i];

		if (isChinese(char)) {
			const pinyin = charToPinyin(char);
			if (pinyin !== char) {
				// Successfully converted to pinyin
				pinyinParts.push(pinyin);
			} else {
				// Unknown character - add placeholder or skip
				pinyinParts.push(`[${char}]`);
			}
		} else if (char === ' ' && pinyinParts.length > 0) {
			// Space between Chinese phrases
			result += pinyinParts.join(separator) + ' ';
			pinyinParts = [];
		} else if (/[.,!?;:]/.test(char)) {
			// Punctuation
			if (pinyinParts.length > 0) {
				result += pinyinParts.join(separator);
				pinyinParts = [];
			}
			result += char;
		} else if (!/\s/.test(char)) {
			// Non-Chinese, non-space character (like numbers, English)
			if (pinyinParts.length > 0) {
				result += pinyinParts.join(separator) + ' ';
				pinyinParts = [];
			}
			result += char;
		}
	}

	// Add remaining pinyin parts
	if (pinyinParts.length > 0) {
		result += pinyinParts.join(separator);
	}

	// Clean up extra spaces
	result = result.replace(/\s+/g, ' ').trim();

	// Capitalize first letter
	return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Get pinyin with tone marks (simplified - using tone 1 for demonstration)
 */
export function pinyinWithTones(text: string): string {
	// This is a simplified version - in reality, you'd need tone information
	// For now, just return the basic pinyin
	const basicPinyin = pinyinize(text);

	// Apply some basic tone marks to common syllables (simplified)
	return basicPinyin
		.replace(/\bni\b/g, 'nǐ')
		.replace(/\bhao\b/g, 'hǎo')
		.replace(/\bwo\b/g, 'wǒ')
		.replace(/\bshi\b/g, 'shì')
		.replace(/\bjin\b/g, 'jīn')
		.replace(/\btian\b/g, 'tiān')
		.replace(/\bqi\b/g, 'qì')
		.replace(/\bhen\b/g, 'hěn')
		.replace(/\bbei\b/g, 'běi')
		.replace(/\bjing\b/g, 'jīng')
		.replace(/\bzhong\b/g, 'zhōng')
		.replace(/\bguo\b/g, 'guó')
		.replace(/\bshou\b/g, 'shǒu')
		.replace(/\bdou\b/g, 'dōu')
		.replace(/\bxie\b/g, 'xiè')
		.replace(/\bxue\b/g, 'xué')
		.replace(/\bxi\b/g, 'xí')
		.replace(/\bwen\b/g, 'wén');
}

/**
 * Get statistics about Chinese text
 */
export function getChineseStats(text: string): {
	totalChars: number;
	chineseChars: number;
	knownChars: number;
	unknownChars: number;
	coverage: number;
} {
	let chineseChars = 0;
	let knownChars = 0;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (isChinese(char)) {
			chineseChars++;
			if (PINYIN_MAP[char]) {
				knownChars++;
			}
		}
	}

	const unknownChars = chineseChars - knownChars;
	const coverage = chineseChars > 0 ? (knownChars / chineseChars) * 100 : 0;

	return {
		totalChars: text.length,
		chineseChars,
		knownChars,
		unknownChars,
		coverage: Math.round(coverage * 10) / 10 // Round to 1 decimal
	};
}
