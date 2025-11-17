/**
 * 🎨 Scenario Image Service
 *
 * Provides watercolor/artistic style images for scenario cards using free APIs.
 * Supports Unsplash and Pexels for high-quality, artistic imagery.
 *
 * **Free Image APIs:**
 * - Unsplash: 50 requests/hour (free tier)
 * - Pexels: Unlimited (free with attribution)
 *
 * **Usage:**
 * ```typescript
 * const imageUrl = await getScenarioImage('family-dinner', ['family', 'dinner']);
 * const imageUrl = getWatercolorPlaceholder('relationships');
 * ```
 */

import { env } from '$env/dynamic/private';

export type ScenarioCategory =
	| 'relationships'
	| 'professional'
	| 'travel'
	| 'education'
	| 'health'
	| 'daily_life'
	| 'entertainment'
	| 'food_drink'
	| 'services'
	| 'emergency';

interface ImageSearchResult {
	url: string;
	attribution: string;
	source: 'unsplash' | 'pexels' | 'placeholder';
}

/**
 * Category-specific watercolor search terms for better image matching
 */
const CATEGORY_SEARCH_TERMS: Record<ScenarioCategory, string[]> = {
	relationships: ['watercolor family', 'watercolor couple', 'watercolor hearts'],
	professional: ['watercolor office', 'watercolor business', 'watercolor handshake'],
	travel: ['watercolor map', 'watercolor travel', 'watercolor airplane'],
	education: ['watercolor books', 'watercolor school', 'watercolor learning'],
	health: ['watercolor wellness', 'watercolor health', 'watercolor medical'],
	daily_life: ['watercolor home', 'watercolor daily', 'watercolor life'],
	entertainment: ['watercolor music', 'watercolor art', 'watercolor hobby'],
	food_drink: ['watercolor food', 'watercolor restaurant', 'watercolor drinks'],
	services: ['watercolor service', 'watercolor help', 'watercolor support'],
	emergency: ['watercolor alert', 'watercolor help', 'watercolor urgent']
};

/**
 * Generate CSS gradient backgrounds as fallback (no API needed)
 * Watercolor-inspired gradient palettes by category
 */
const WATERCOLOR_GRADIENTS: Record<ScenarioCategory, string> = {
	relationships:
		'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)', // Warm pinks/peach
	professional:
		'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #fddb92 100%)', // Cool blues to gold
	travel: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #a1c4fd 100%)', // Sunrise colors
	education:
		'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 50%, #fdcbf1 100%)', // Soft purples/blues
	health: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 50%, #a8edea 100%)', // Fresh greens/aqua
	daily_life: 'linear-gradient(135deg, #fff1eb 0%, #ace0f9 50%, #ffeaa7 100%)', // Neutral pastels
	entertainment:
		'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #30cfd0 100%)', // Vibrant multi-color
	food_drink:
		'linear-gradient(135deg, #fddb92 0%, #d1913c 50%, #ffeaa7 100%)', // Warm yellows/golds
	services: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 50%, #96deda 100%)', // Calm teals
	emergency: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #ffecd2 100%)' // Soft alert colors
};

/**
 * Get a watercolor-style gradient background (no API needed, instant)
 * Perfect fallback or for MVP without API keys
 */
export function getWatercolorGradient(category: ScenarioCategory): string {
	return WATERCOLOR_GRADIENTS[category];
}

/**
 * Fetch watercolor-style image from Unsplash API
 * Requires UNSPLASH_ACCESS_KEY in environment
 */
async function fetchUnsplashImage(
	searchTerms: string[]
): Promise<ImageSearchResult | null> {
	const accessKey = env.UNSPLASH_ACCESS_KEY;
	if (!accessKey) {
		console.warn('UNSPLASH_ACCESS_KEY not configured, skipping Unsplash');
		return null;
	}

	try {
		const query = searchTerms.join(' ');
		const response = await fetch(
			`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
			{
				headers: {
					Authorization: `Client-ID ${accessKey}`
				}
			}
		);

		if (!response.ok) {
			console.error(`Unsplash API error: ${response.status}`);
			return null;
		}

		const data = await response.json();
		if (data.results && data.results.length > 0) {
			const photo = data.results[0];
			return {
				url: photo.urls.regular,
				attribution: `Photo by ${photo.user.name} on Unsplash`,
				source: 'unsplash'
			};
		}
	} catch (error) {
		console.error('Error fetching Unsplash image:', error);
	}

	return null;
}

/**
 * Fetch watercolor-style image from Pexels API
 * Requires PEXELS_API_KEY in environment
 */
async function fetchPexelsImage(searchTerms: string[]): Promise<ImageSearchResult | null> {
	const apiKey = env.PEXELS_API_KEY;
	if (!apiKey) {
		console.warn('PEXELS_API_KEY not configured, skipping Pexels');
		return null;
	}

	try {
		const query = searchTerms.join(' ');
		const response = await fetch(
			`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
			{
				headers: {
					Authorization: apiKey
				}
			}
		);

		if (!response.ok) {
			console.error(`Pexels API error: ${response.status}`);
			return null;
		}

		const data = await response.json();
		if (data.photos && data.photos.length > 0) {
			const photo = data.photos[0];
			return {
				url: photo.src.large,
				attribution: `Photo by ${photo.photographer} on Pexels`,
				source: 'pexels'
			};
		}
	} catch (error) {
		console.error('Error fetching Pexels image:', error);
	}

	return null;
}

/**
 * Get scenario image with watercolor/artistic style
 * Tries Unsplash first, falls back to Pexels, then gradient
 *
 * @param scenarioId - Unique scenario identifier
 * @param tags - Scenario tags for better image matching
 * @param category - Primary category for fallback gradient
 * @returns Image URL or CSS gradient string
 */
export async function getScenarioImage(
	scenarioId: string,
	tags: string[] = [],
	category: ScenarioCategory = 'daily_life'
): Promise<{ imageUrl: string; isGradient: boolean; attribution?: string }> {
	// Build search terms: watercolor + category terms + custom tags
	const categoryTerms = CATEGORY_SEARCH_TERMS[category] || [];
	const searchTerms = [...categoryTerms, ...tags.map((tag) => `watercolor ${tag}`)];

	// Try Unsplash first (best quality watercolor images)
	const unsplashResult = await fetchUnsplashImage(searchTerms);
	if (unsplashResult) {
		return {
			imageUrl: unsplashResult.url,
			isGradient: false,
			attribution: unsplashResult.attribution
		};
	}

	// Fall back to Pexels
	const pexelsResult = await fetchPexelsImage(searchTerms);
	if (pexelsResult) {
		return {
			imageUrl: pexelsResult.url,
			isGradient: false,
			attribution: pexelsResult.attribution
		};
	}

	// Final fallback: watercolor-style gradient (always works, no API needed)
	return {
		imageUrl: getWatercolorGradient(category),
		isGradient: true
	};
}

/**
 * Batch fetch images for multiple scenarios
 * Useful for pre-populating scenario cards
 */
export async function batchGetScenarioImages(
	scenarios: Array<{
		id: string;
		tags?: string[];
		categories?: string[];
	}>
): Promise<Map<string, { imageUrl: string; isGradient: boolean; attribution?: string }>> {
	const results = new Map();

	// Process in parallel with rate limiting (max 10 concurrent)
	const chunks = [];
	for (let i = 0; i < scenarios.length; i += 10) {
		chunks.push(scenarios.slice(i, i + 10));
	}

	for (const chunk of chunks) {
		const promises = chunk.map(async (scenario) => {
			const primaryCategory = (scenario.categories?.[0] as ScenarioCategory) || 'daily_life';
			const result = await getScenarioImage(scenario.id, scenario.tags, primaryCategory);
			return { id: scenario.id, result };
		});

		const chunkResults = await Promise.all(promises);
		chunkResults.forEach(({ id, result }) => {
			results.set(id, result);
		});

		// Rate limiting delay between chunks (respect API limits)
		if (chunks.length > 1) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	return results;
}

/**
 * Get placeholder image URL for a given category
 * Instant, no API calls, perfect for development/fallback
 */
export function getWatercolorPlaceholder(category: ScenarioCategory): string {
	return getWatercolorGradient(category);
}

/**
 * Recommended image dimensions for scenario cards
 */
export const SCENARIO_IMAGE_DIMENSIONS = {
	thumbnail: { width: 400, height: 250 },
	card: { width: 800, height: 500 },
	hero: { width: 1200, height: 600 }
} as const;
