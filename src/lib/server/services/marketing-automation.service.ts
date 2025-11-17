import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Initialize Resend
const _resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

export interface MarketingContent {
	platform: 'reddit' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
	content: string;
	hashtags: string[];
	imagePrompt?: string;
	scheduledFor?: Date;
}

export interface JapanesePhrase {
	english: string;
	japanese: string;
	romaji: string;
	context: string;
	formality: 'casual' | 'polite' | 'formal';
}

export class MarketingAutomationService {
	/**
	 * Generate Reddit post content
	 */
	static generateRedditPost(
		type: 'founder-story' | 'practical-guide' | 'progress-update' | 'question'
	): MarketingContent {
		const templates = {
			'founder-story': {
				content: `**I built an AI partner to practice conversations in my wife's language. It's called Kaiwa.**

Hey everyone,

For years, I've struggled to move past basic phrases in my wife's native language. Textbooks and apps felt disconnected from the real, everyday conversations I wanted to have.

So, I built Kaiwa. It's an AI conversation partner that helps you practice speaking in a low-pressure environment. You can have open-ended chats about anything, and it gives you feedback to improve.

Here's what I learned building this:
- Most language apps focus on vocabulary, not conversation flow
- People need practice with emotional conversations, not just ordering food
- The fear of making mistakes with real people is real

The app is free to try - just 3 minutes to see if it clicks for you.

I'm hoping this can help other couples, families, and anyone trying to bridge a language gap.

Happy to answer any questions!`,
				hashtags: ['#LanguageLearning', '#AI', '#ConversationPractice', '#Relationships', '#Tech']
			},
			'practical-guide': {
				content: `**How I'm using AI to practice the *emotional* side of speaking a new language.**

Hey language learners,

One of the hardest parts of learning a new language isn't just vocabulary, it's navigating real conversations with nuance and emotion.

I've been building a tool, Kaiwa, to work on this. Instead of just drilling words, I can simulate conversations like:
- "Making plans with my partner's family"
- "Apologizing for a misunderstanding" 
- "Sharing a personal story"

The AI partner responds naturally, which lets me practice the flow of conversation without the fear of making mistakes with a real person.

It's been a game-changer for my confidence. Has anyone else found good ways to practice these kinds of conversations?

(Link in comments if anyone's interested - self-promo disclosure!)`,
				hashtags: ['#LanguageLearning', '#ConversationPractice', '#AI', '#Confidence', '#Practice']
			},
			'progress-update': {
				content: `**3 months of daily AI conversation practice - here's what I learned**

Started using Kaiwa (my own app) daily for 3 months to practice Japanese with my wife's family. Here's what happened:

✅ **Confidence boost**: Went from avoiding conversations to initiating them
✅ **Natural flow**: Stopped translating in my head so much
✅ **Emotional conversations**: Can now handle sensitive topics without panic

The key was practicing scenarios that actually matter to me - not just "order coffee" but "explain why I'm stressed about work" or "comfort someone who's sad."

Anyone else tried AI conversation practice? What worked for you?`,
				hashtags: ['#LanguageLearning', '#Japanese', '#Progress', '#AI', '#Conversation']
			},
			question: {
				content: `**What's the hardest part of learning your partner's language?**

I'm building a language learning app and curious about your experiences.

For me, it's the emotional conversations - like apologizing when I mess up cultural norms, or explaining why I'm homesick. The grammar and vocabulary I can study, but the flow and nuance of real conversations? That's tough.

What's been your biggest challenge? And what helped you get past it?`,
				hashtags: ['#LanguageLearning', '#Relationships', '#Conversation', '#Challenges', '#Help']
			}
		};

		const template = templates[type];
		return {
			platform: 'reddit',
			content: template.content,
			hashtags: template.hashtags
		};
	}

	/**
	 * Generate Instagram post content
	 */
	static generateInstagramPost(
		type: 'scenario-demo' | 'motivation' | 'tips' | 'behind-scenes'
	): MarketingContent {
		const templates = {
			'scenario-demo': {
				content: `🗣️ Practicing "Meeting the Parents" scenario in Japanese

This is one of my favorite scenarios in Kaiwa - it's so real! The AI plays my partner's mom, and I practice explaining my job, answering questions about our future, and handling those awkward silences.

The best part? I can mess up as many times as I want without anyone judging me. It's like having a safe space to practice the conversations that actually matter.

What conversation would you want to practice? Drop it below! 👇

#LanguageLearning #Japanese #ConversationPractice #AI #Confidence #Practice #Relationships`,
				hashtags: [
					'#LanguageLearning',
					'#Japanese',
					'#ConversationPractice',
					'#AI',
					'#Confidence',
					'#Practice',
					'#Relationships',
					'#MeetingParents',
					'#LanguageGoals'
				]
			},
			motivation: {
				content: `💪 30 days of daily conversation practice

Started with 5 minutes a day, now I'm doing 15-20 minutes. The progress is real!

✨ Went from avoiding phone calls to initiating them
✨ Can handle emotional conversations without panic
✨ My partner's family actually understands me now

The secret? Practice the conversations that matter to YOU. Not "order coffee" but "explain why you're stressed" or "comfort someone who's sad."

What's your language learning goal? Let's support each other! 🙌

#LanguageLearning #Progress #Motivation #ConversationPractice #Goals #Support #Community`,
				hashtags: [
					'#LanguageLearning',
					'#Progress',
					'#Motivation',
					'#ConversationPractice',
					'#Goals',
					'#Support',
					'#Community',
					'#30DayChallenge',
					'#LanguageGoals'
				]
			},
			tips: {
				content: `🎯 3 tips that changed my language learning

1. **Practice emotional conversations** - Not just "where's the bathroom" but "I'm sorry I hurt your feelings"

2. **Use AI for safe practice** - Mess up as many times as you want without judgment

3. **Focus on flow, not perfection** - Native speakers care more about understanding you than perfect grammar

The conversations that matter are the hard ones. The ones that build real relationships.

What's your biggest language learning challenge? Let's solve it together! 💬

#LanguageLearning #Tips #ConversationPractice #AI #Confidence #Relationships #LanguageGoals`,
				hashtags: [
					'#LanguageLearning',
					'#Tips',
					'#ConversationPractice',
					'#AI',
					'#Confidence',
					'#Relationships',
					'#LanguageGoals',
					'#LanguageTips',
					'#Practice'
				]
			},
			'behind-scenes': {
				content: `🔧 Behind the scenes: Building Kaiwa

This is my home office where I built Kaiwa - an AI conversation partner for language learners.

The idea came from my own struggle: I could study Japanese for hours but still panic when my wife's mom asked me a simple question.

So I built something that lets me practice the conversations that actually matter - the emotional ones, the relationship ones, the ones that build real connections.

It's not perfect, but it's helping me (and hopefully others) bridge the gap between studying a language and actually using it.

What's your language learning story? I'd love to hear it! 📖

#LanguageLearning #AI #Tech #Startup #ConversationPractice #BehindTheScenes #LanguageGoals`,
				hashtags: [
					'#LanguageLearning',
					'#AI',
					'#Tech',
					'#Startup',
					'#ConversationPractice',
					'#BehindTheScenes',
					'#LanguageGoals',
					'#Building',
					'#Creator'
				]
			}
		};

		const template = templates[type];
		return {
			platform: 'instagram',
			content: template.content,
			hashtags: template.hashtags,
			imagePrompt: this.getImagePrompt(type)
		};
	}

	/**
	 * Generate Twitter/X post content
	 */
	static generateTwitterPost(
		type: 'quick-tip' | 'question' | 'update' | 'thread-starter'
	): MarketingContent {
		const templates = {
			'quick-tip': {
				content: `💡 Language learning tip: Practice the conversations that matter to YOU.

Not "where's the bathroom" but "I'm sorry I hurt your feelings."

The emotional conversations are the ones that build real relationships.`,
				hashtags: ['#LanguageLearning', '#Tips', '#ConversationPractice']
			},
			question: {
				content: `What's the hardest conversation you've had to have in a second language?

For me, it was explaining to my partner's family why I was homesick. The words were there, but the emotion was hard to convey.`,
				hashtags: ['#LanguageLearning', '#Conversation', '#Challenges']
			},
			update: {
				content: `30 days of daily AI conversation practice = game changer.

Went from avoiding phone calls to initiating them. The confidence boost is real! 🚀`,
				hashtags: ['#LanguageLearning', '#AI', '#Progress', '#Confidence']
			},
			'thread-starter': {
				content: `🧵 Building an AI conversation partner taught me something surprising about language learning:

Most apps focus on vocabulary and grammar. But the real challenge? The flow of conversation.

1/`,
				hashtags: ['#LanguageLearning', '#AI', '#Thread', '#ConversationPractice']
			}
		};

		const template = templates[type];
		return {
			platform: 'twitter',
			content: template.content,
			hashtags: template.hashtags
		};
	}

	/**
	 * Generate LinkedIn post content
	 */
	static generateLinkedInPost(
		type: 'professional' | 'insight' | 'story' | 'question'
	): MarketingContent {
		const templates = {
			professional: {
				content: `The Future of Language Learning: Beyond Vocabulary to Conversation

After building Kaiwa, an AI conversation partner, I've learned that most language learning tools miss a crucial element: the emotional flow of real conversations.

While apps excel at teaching vocabulary and grammar, they often fail to prepare learners for the nuanced, relationship-building conversations that matter most in personal and professional contexts.

Key insights from user feedback:
• People need practice with emotional conversations, not just transactional ones
• The fear of making mistakes with real people is a significant barrier
• AI can provide a safe space for practice without judgment

The technology exists to bridge this gap. The question is: how can we make conversation practice as accessible as vocabulary drills?

What's your experience with language learning tools? What's missing?`,
				hashtags: [
					'#LanguageLearning',
					'#AI',
					'#EdTech',
					'#ConversationPractice',
					'#Innovation',
					'#Technology'
				]
			},
			insight: {
				content: `3 Lessons from Building an AI Language Learning Tool

1. **Emotion matters more than perfection**
Users care more about being understood than perfect grammar. Focus on communication flow.

2. **Safe practice spaces are crucial**
People need to make mistakes without judgment. AI provides this safety net.

3. **Real conversations drive engagement**
Generic scenarios don't stick. Personal, relevant conversations do.

The biggest challenge in language learning isn't technical - it's psychological. How do we build confidence alongside competence?`,
				hashtags: [
					'#LanguageLearning',
					'#AI',
					'#EdTech',
					'#Insights',
					'#Innovation',
					'#UserExperience'
				]
			},
			story: {
				content: `From Language Anxiety to Confidence: A Personal Journey

I built Kaiwa because I struggled with Japanese conversations with my wife's family. I could study for hours but still panic when asked a simple question.

The breakthrough came when I realized: I wasn't practicing the right conversations. I was drilling vocabulary but avoiding the emotional, relationship-building conversations that actually mattered.

This led me to build an AI conversation partner that focuses on real scenarios - apologizing for misunderstandings, explaining cultural differences, sharing personal stories.

The result? I went from avoiding phone calls to initiating them. My confidence grew because I was practicing conversations that actually mattered to my relationships.

Sometimes the best solutions come from solving your own problems. What problem are you solving?`,
				hashtags: [
					'#LanguageLearning',
					'#PersonalStory',
					'#AI',
					'#Innovation',
					'#ProblemSolving',
					'#Confidence'
				]
			},
			question: {
				content: `What's the biggest challenge in language learning today?

Is it:
• Lack of conversation practice opportunities?
• Fear of making mistakes with real people?
• Disconnect between study materials and real-world usage?
• Something else?

I'm building tools to address these challenges and would love to hear your perspective. What's been your experience?`,
				hashtags: [
					'#LanguageLearning',
					'#EdTech',
					'#ConversationPractice',
					'#Challenges',
					'#Innovation',
					'#Discussion'
				]
			}
		};

		const template = templates[type];
		return {
			platform: 'linkedin',
			content: template.content,
			hashtags: template.hashtags
		};
	}

	/**
	 * Generate TikTok video script
	 */
	static generateTikTokScript(
		type: 'scenario-demo' | 'quick-tip' | 'story' | 'challenge'
	): MarketingContent {
		const templates = {
			'scenario-demo': {
				content: `🎬 TikTok Script: Scenario Demo

[0-3s] Hook: "POV: You're meeting your partner's parents for the first time... in their language"

[3-8s] Problem: "I used to panic and avoid these conversations. What if I say something wrong?"

[8-15s] Solution: "Now I practice with AI first. Same scenario, zero judgment."

[15-20s] Demo: Show actual conversation practice

[20-25s] Result: "Confidence through practice. Try it yourself!"

[25-30s] CTA: "Link in bio to start practicing"

#LanguageLearning #ConversationPractice #AI #Confidence #MeetingParents #LanguageGoals`,
				hashtags: [
					'#LanguageLearning',
					'#ConversationPractice',
					'#AI',
					'#Confidence',
					'#MeetingParents',
					'#LanguageGoals',
					'#POV',
					'#Practice',
					'#Confidence'
				]
			},
			'quick-tip': {
				content: `🎬 TikTok Script: Quick Tip

[0-2s] Hook: "Language learning hack that changed everything"

[2-5s] Tip: "Practice emotional conversations, not just 'where's the bathroom'"

[5-10s] Example: "Try 'I'm sorry I hurt your feelings' instead of 'I need coffee'"

[10-15s] Why: "These conversations build real relationships"

[15-18s] CTA: "What conversation scares you most? Comment below!"

#LanguageLearning #Tips #ConversationPractice #Relationships #LanguageHacks #Confidence`,
				hashtags: [
					'#LanguageLearning',
					'#Tips',
					'#ConversationPractice',
					'#Relationships',
					'#LanguageHacks',
					'#Confidence',
					'#QuickTip',
					'#Hack'
				]
			},
			story: {
				content: `🎬 TikTok Script: Personal Story

[0-3s] Hook: "I built an AI app because I was scared of my wife's family"

[3-8s] Problem: "I could study Japanese for hours but still panic when they asked me anything"

[8-15s] Journey: "So I built something to practice the conversations that actually mattered"

[15-22s] Result: "Now I can have real conversations without fear"

[22-25s] CTA: "What's your language learning story? Let's support each other!"

#LanguageLearning #PersonalStory #AI #Confidence #Relationships #LanguageGoals #Support #Community`,
				hashtags: [
					'#LanguageLearning',
					'#PersonalStory',
					'#AI',
					'#Confidence',
					'#Relationships',
					'#LanguageGoals',
					'#Support',
					'#Community',
					'#Story'
				]
			},
			challenge: {
				content: `🎬 TikTok Script: Challenge

[0-3s] Hook: "30-day language conversation challenge - who's in?"

[3-8s] Rules: "5 minutes a day, practice one real conversation scenario"

[8-15s] Examples: "Apologize for a mistake, explain your feelings, make plans"

[15-22s] Motivation: "Track your progress, build confidence, see real results"

[22-25s] CTA: "Comment 'challenge' to join! Let's do this together!"

#LanguageLearning #Challenge #ConversationPractice #30DayChallenge #Confidence #Community #LanguageGoals #Motivation`,
				hashtags: [
					'#LanguageLearning',
					'#Challenge',
					'#ConversationPractice',
					'#30DayChallenge',
					'#Confidence',
					'#Community',
					'#LanguageGoals',
					'#Motivation',
					'#Challenge'
				]
			}
		};

		const template = templates[type];
		return {
			platform: 'tiktok',
			content: template.content,
			hashtags: template.hashtags
		};
	}

	/**
	 * Get image prompt for Instagram posts
	 */
	private static getImagePrompt(type: string): string {
		const prompts = {
			'scenario-demo':
				'A person having a friendly conversation with a smartphone showing AI interface, warm lighting, modern home setting',
			motivation:
				'Split screen showing before/after confidence levels, person looking nervous vs confident, motivational colors',
			tips: 'Clean infographic style with language learning tips, modern design, educational feel',
			'behind-scenes':
				'Home office setup with laptop, coffee, notes, coding on screen, cozy workspace atmosphere'
		};
		return prompts[type] || 'Modern, clean design for language learning content';
	}

	/**
	 * Generate Japanese phrases for marketing
	 */
	static getJapanesePhrases(): JapanesePhrase[] {
		return [
			{
				english: "I'm practicing Japanese to connect with my partner's family",
				japanese: 'パートナーの家族とつながるために日本語を練習しています',
				romaji: 'Paatonaa no kazoku to tsunagaru tame ni nihongo o renshuu shite imasu',
				context: 'Explaining your language learning motivation',
				formality: 'polite'
			},
			{
				english: "I'm sorry, I didn't understand. Could you repeat that?",
				japanese: 'すみません、わかりませんでした。もう一度言っていただけますか？',
				romaji: 'Sumimasen, wakarimasen deshita. Mou ichido itte itadakemasu ka?',
				context: 'Asking for clarification politely',
				formality: 'polite'
			},
			{
				english: "I'm still learning, so please be patient with me",
				japanese: 'まだ勉強中なので、お手柔らかにお願いします',
				romaji: 'Mada benkyou chuu na node, oteyawaraka ni onegaishimasu',
				context: 'Asking for patience while learning',
				formality: 'polite'
			},
			{
				english: 'Thank you for teaching me about your culture',
				japanese: '文化について教えてくれてありがとうございます',
				romaji: 'Bunka ni tsuite oshiete kurete arigatou gozaimasu',
				context: 'Expressing gratitude for cultural learning',
				formality: 'polite'
			},
			{
				english: 'I want to have deeper conversations with you',
				japanese: 'あなたともっと深い会話がしたいです',
				romaji: 'Anata to motto fukai kaiwa ga shitai desu',
				context: 'Expressing desire for meaningful conversation',
				formality: 'polite'
			},
			{
				english: "I'm nervous but excited to practice with you",
				japanese: '緊張しますが、一緒に練習するのが楽しみです',
				romaji: 'Kinchou shimasu ga, issho ni renshuu suru no ga tanoshimi desu',
				context: 'Expressing mixed feelings about practice',
				formality: 'polite'
			},
			{
				english: 'What do you think about this?',
				japanese: 'これについてどう思いますか？',
				romaji: 'Kore ni tsuite dou omoimasu ka?',
				context: 'Asking for opinion',
				formality: 'polite'
			},
			{
				english: "I'm grateful for your patience with my Japanese",
				japanese: '私の日本語に辛抱強く接してくれて感謝しています',
				romaji: 'Watashi no nihongo ni shinbou tsuyoku sesshite kurete kansha shite imasu',
				context: 'Expressing gratitude for patience',
				formality: 'polite'
			}
		];
	}

	/**
	 * Generate marketing content for a specific platform and type
	 */
	static generateContent(platform: string, type: string): MarketingContent {
		switch (platform.toLowerCase()) {
			case 'reddit':
				return this.generateRedditPost(
					type as 'founder-story' | 'practical-guide' | 'progress-update' | 'question'
				);
			case 'instagram':
				return this.generateInstagramPost(
					type as 'scenario-demo' | 'motivation' | 'tips' | 'behind-scenes'
				);
			case 'twitter':
				return this.generateTwitterPost(
					type as 'quick-tip' | 'question' | 'update' | 'thread-starter'
				);
			case 'linkedin':
				return this.generateLinkedInPost(type as 'professional' | 'insight' | 'story' | 'question');
			case 'tiktok':
				return this.generateTikTokScript(
					type as 'scenario-demo' | 'quick-tip' | 'story' | 'challenge'
				);
			default:
				throw new Error(`Unsupported platform: ${platform}`);
		}
	}

	/**
	 * Get all available content types for a platform
	 */
	static getContentTypes(platform: string): string[] {
		const types = {
			reddit: ['founder-story', 'practical-guide', 'progress-update', 'question'],
			instagram: ['scenario-demo', 'motivation', 'tips', 'behind-scenes'],
			twitter: ['quick-tip', 'question', 'update', 'thread-starter'],
			linkedin: ['professional', 'insight', 'story', 'question'],
			tiktok: ['scenario-demo', 'quick-tip', 'story', 'challenge']
		};
		return types[platform.toLowerCase()] || [];
	}

	/**
	 * Schedule content for posting
	 */
	static scheduleContent(content: MarketingContent, scheduledFor: Date): MarketingContent {
		return {
			...content,
			scheduledFor
		};
	}
}
