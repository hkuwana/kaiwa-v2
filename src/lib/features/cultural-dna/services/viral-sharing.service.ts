// 📱 Viral Sharing Service
// Handles generation of shareable links and social media content for Cultural DNA results

import type { CulturalDNA, ShareLinkData } from '../types/cultural-dna.types';

// Generate share link for different platforms
export function generateShareLink(dna: CulturalDNA, platform: 'instagram' | 'tiktok' | 'twitter' | 'whatsapp' | 'link'): string {
	const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaiwa.app';
	const resultUrl = `${baseUrl}${dna.shareableData.shareUrl}`;

	const shareData: ShareLinkData = {
		dnaId: dna.id,
		personalityType: dna.personalityType,
		culturalMix: dna.shareableData.culturalMixSummary,
		shareText: generateShareText(dna, platform),
		platform
	};

	switch (platform) {
		case 'instagram':
			// Instagram doesn't support URL parameters for stories, so return the base URL
			return resultUrl;

		case 'tiktok':
			// TikTok web sharing
			const tiktokText = encodeURIComponent(shareData.shareText);
			return `https://www.tiktok.com/share?url=${encodeURIComponent(resultUrl)}&title=${tiktokText}`;

		case 'twitter':
			const twitterText = encodeURIComponent(shareData.shareText);
			const hashtags = encodeURIComponent(dna.shareableData.hashtags.join(','));
			return `https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(resultUrl)}&hashtags=${hashtags}`;

		case 'whatsapp':
			const whatsappText = encodeURIComponent(`${shareData.shareText}\n\n${resultUrl}`);
			return `https://wa.me/?text=${whatsappText}`;

		case 'link':
		default:
			return resultUrl;
	}
}

// Generate platform-specific share text
function generateShareText(dna: CulturalDNA, platform: string): string {
	const { personalityType, culturalMixSummary, oneLineSummary } = dna.shareableData;

	switch (platform) {
		case 'instagram':
			return `I'm ${personalityType}! 🧬\n${culturalMixSummary}\n\n${oneLineSummary}\n\nWhat's YOUR conversation DNA? Discover yours at Kaiwa! ✨`;

		case 'tiktok':
			return `POV: You just discovered you're ${personalityType} 🧬 ${culturalMixSummary} - what are you? #CulturalDNA #PersonalityTest #LanguageLearning`;

		case 'twitter':
			return `Just discovered I'm ${personalityType}! 🧬\n\n${culturalMixSummary}\n\n"${oneLineSummary}"\n\nWhat's your Cultural Conversation DNA?`;

		case 'whatsapp':
			return `Hey! I just found out I'm "${personalityType}" - ${culturalMixSummary}! 🧬\n\nApparently I'm "${oneLineSummary}" 😄\n\nYou should try this Cultural DNA test too!`;

		default:
			return `I'm ${personalityType}! ${culturalMixSummary}. Discover your Cultural Conversation DNA!`;
	}
}

// Generate shareable image URL (placeholder for future implementation)
export function generateShareImageUrl(dna: CulturalDNA, format: 'square' | 'story' | 'landscape' = 'square'): string {
	// This would generate a beautiful graphic showing:
	// - DNA helix with cultural flags
	// - Personality type headline
	// - Cultural mix percentages
	// - Kaiwa branding

	const params = new URLSearchParams({
		type: dna.personalityType,
		mix: dna.shareableData.culturalMixSummary,
		format,
		id: dna.id
	});

	// In production, this would hit an image generation API
	return `/api/cultural-dna/share-image?${params.toString()}`;
}

// Copy link to clipboard
export async function copyShareLink(dna: CulturalDNA): Promise<boolean> {
	if (!navigator.clipboard) {
		console.warn('Clipboard API not available');
		return false;
	}

	try {
		const shareUrl = generateShareLink(dna, 'link');
		await navigator.clipboard.writeText(shareUrl);
		console.log('🔗 Share link copied to clipboard');
		return true;
	} catch (err) {
		console.error('Failed to copy share link:', err);
		return false;
	}
}

// Share via Web Share API (mobile)
export async function shareViaWebAPI(dna: CulturalDNA): Promise<boolean> {
	if (!navigator.share) {
		console.warn('Web Share API not available');
		return false;
	}

	try {
		await navigator.share({
			title: `My Cultural DNA: ${dna.personalityType}`,
			text: generateShareText(dna, 'default'),
			url: generateShareLink(dna, 'link')
		});
		console.log('📱 Shared via Web Share API');
		return true;
	} catch (err) {
		console.error('Web Share API failed:', err);
		return false;
	}
}

// Generate QR code for easy sharing
export function generateQRCodeUrl(dna: CulturalDNA): string {
	const shareUrl = generateShareLink(dna, 'link');
	// Using a free QR code service - in production you might want to use your own
	return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
}

// Analytics tracking for shares
export function trackShare(dna: CulturalDNA, platform: string): void {
	// Track viral sharing events for analytics
	console.log('📊 Tracking share:', {
		dnaId: dna.id,
		personalityType: dna.personalityType,
		platform,
		timestamp: new Date()
	});

	// In production, this would send to your analytics service
	// trackEvent('cultural_dna_shared', {
	//   personality_type: dna.personalityType,
	//   platform,
	//   cultural_mix: dna.culturalMix.map(m => m.culture).join(',')
	// });
}

// Validate share link data
export function validateShareData(shareData: any): shareData is ShareLinkData {
	return (
		typeof shareData.dnaId === 'string' &&
		typeof shareData.personalityType === 'string' &&
		typeof shareData.culturalMix === 'string' &&
		typeof shareData.shareText === 'string' &&
		['instagram', 'tiktok', 'twitter', 'whatsapp', 'link'].includes(shareData.platform)
	);
}