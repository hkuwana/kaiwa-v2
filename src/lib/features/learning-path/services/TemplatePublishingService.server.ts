// src/lib/features/learning-path/services/TemplatePublishingService.server.ts

import { nanoid } from 'nanoid';
import { logger } from '$lib/logger';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import type { LearningPath, NewLearningPath } from '$lib/server/db/types';

/**
 * TemplatePublishingService - Create public, anonymous learning path templates
 *
 * This service transforms user-specific learning paths into shareable, anonymous
 * templates suitable for public discovery and SEO. It handles:
 * - PII scrubbing from titles and descriptions
 * - Unique share slug generation
 * - Template creation with proper flags
 * - Authorization validation
 *
 * **Key Features:**
 * - 🔒 PII protection: Removes personal information
 * - 🌐 Public templates: userId=NULL, isTemplate=TRUE
 * - 🔗 Unique slugs: SEO-friendly URLs
 * - ✅ Auth validation: Only path owners can publish
 *
 * **Server-Side Only** - Must not be imported in browser code
 *
 * @example
 * ```typescript
 * // Publish a user's path as public template
 * const result = await TemplatePublishingService.createAnonymousTemplate(
 *   'path-123',
 *   'user-456'
 * );
 *
 * if (result.success) {
 *   console.log('Template created:', result.template.shareSlug);
 *   console.log('Share URL:', result.shareUrl);
 * }
 * ```
 */
export class TemplatePublishingService {
	/**
	 * Creates an anonymous public template from a user's learning path
	 *
	 * Process:
	 * 1. Fetch the original path
	 * 2. Verify user owns the path
	 * 3. Scrub PII from title and description
	 * 4. Generate unique share slug
	 * 5. Create new template path with userId=NULL
	 * 6. Return template with share URL
	 *
	 * @param pathId - ID of the learning path to publish
	 * @param userId - ID of the user requesting to publish (for auth)
	 * @returns Result with template and share URL, or error
	 */
	static async createAnonymousTemplate(
		pathId: string,
		userId: string
	): Promise<
		{ success: true; template: LearningPath; shareUrl: string } | { success: false; error: string }
	> {
		try {
			logger.info('📤 [TemplatePublishing] Creating anonymous template', {
				pathId,
				userId
			});

			// 1. Fetch the original path
			const originalPath = await learningPathRepository.findPathById(pathId);

			if (!originalPath) {
				logger.warn('❌ [TemplatePublishing] Path not found', { pathId });
				return {
					success: false,
					error: 'Learning path not found'
				};
			}

			// 2. Verify ownership
			if (originalPath.userId !== userId) {
				logger.warn('❌ [TemplatePublishing] Unauthorized attempt to publish path', {
					pathId,
					userId,
					actualOwner: originalPath.userId
				});
				return {
					success: false,
					error: 'You do not have permission to publish this learning path'
				};
			}

			// 3. Check if already published as template
			if (originalPath.isTemplate) {
				logger.warn('⚠️  [TemplatePublishing] Path is already a template', { pathId });
				return {
					success: false,
					error: 'This learning path is already a template'
				};
			}

			// 4. Scrub PII from title and description
			const scrubbedTitle = this.scrubPII(originalPath.title);
			const scrubbedDescription = this.scrubPII(originalPath.description);

			// 5. Generate unique share slug
			const shareSlug = await this.generateUniqueSlug(scrubbedTitle, originalPath.targetLanguage);

			// 6. Create template path
			const templateId = `template-${nanoid(12)}`;

			const templateData: NewLearningPath = {
				id: templateId,
				userId: null, // Anonymous template
				title: scrubbedTitle,
				description: scrubbedDescription,
				targetLanguage: originalPath.targetLanguage,
				mode: originalPath.mode, // Preserve the path mode (adaptive or classic)
				schedule: originalPath.schedule,
				isTemplate: true,
				isPublic: true,
				shareSlug,
				status: 'active',
				createdByUserId: userId, // Track who created it
				metadata: originalPath.metadata
			};

			const template = await learningPathRepository.createPathForUser(templateData);

			const shareUrl = `/program/${shareSlug}`;

			logger.info('✅ [TemplatePublishing] Template created successfully', {
				originalPathId: pathId,
				templateId: template.id,
				shareSlug,
				shareUrl
			});

			return {
				success: true,
				template,
				shareUrl
			};
		} catch (error) {
			logger.error('🚨 [TemplatePublishing] Error creating anonymous template', {
				pathId,
				userId,
				error
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to create template'
			};
		}
	}

	/**
	 * Scrubs Personally Identifiable Information (PII) from text
	 *
	 * Removes:
	 * - Common personal names patterns
	 * - Possessive forms ("John's" → "Your")
	 * - Personal pronouns in context ("my girlfriend" → "your partner")
	 * - Specific identifying details
	 *
	 * Examples:
	 * - "Preparing to meet Sarah's parents" → "Preparing to meet your partner's parents"
	 * - "My girlfriend's family" → "Your partner's family"
	 * - "John's business trip" → "Your business trip"
	 *
	 * @param text - Text to scrub PII from
	 * @returns Scrubbed text with PII removed
	 */
	private static scrubPII(text: string): string {
		let scrubbed = text;

		// Replace possessive names (e.g., "Sarah's" → "your partner's")
		// Pattern: Capitalized word followed by 's
		scrubbed = scrubbed.replace(
			/\b[A-Z][a-z]+'s\s+(parents?|family|home|house)/gi,
			"your partner's $1"
		);
		scrubbed = scrubbed.replace(/\b[A-Z][a-z]+'s\s+/g, 'your ');

		// Replace "my [relationship]" → "your [relationship]"
		scrubbed = scrubbed.replace(
			/\bmy\s+(girlfriend|boyfriend|partner|wife|husband|fiancé|fiancée)/gi,
			'your $1'
		);
		scrubbed = scrubbed.replace(/\bmy\s+(family|parents?|boss|colleague)/gi, 'your $1');

		// Replace standalone capitalized names in certain contexts
		// (e.g., "Meeting John" → "Meeting your partner")
		scrubbed = scrubbed.replace(/\b(meeting|visiting|with)\s+[A-Z][a-z]+\b/gi, (match) => {
			const verb = match.split(' ')[0];
			return `${verb} your partner`;
		});

		// Replace "I'm" → "You're" in context
		scrubbed = scrubbed.replace(/\bI'm\s+/g, "You're ");
		scrubbed = scrubbed.replace(/\bI\s+am\s+/g, 'You are ');

		return scrubbed.trim();
	}

	/**
	 * Generates a unique, SEO-friendly share slug
	 *
	 * Process:
	 * 1. Convert title to lowercase kebab-case
	 * 2. Add language prefix (e.g., 'jp-')
	 * 3. Check for uniqueness
	 * 4. Append random suffix if duplicate exists
	 *
	 * Examples:
	 * - "4-Week Japanese: Meeting Partner's Parents" → "jp-meeting-partners-parents"
	 * - "Business Spanish Basics" → "es-business-spanish-basics"
	 *
	 * @param title - Template title
	 * @param targetLanguage - Language code (e.g., 'ja', 'es')
	 * @returns Unique SEO-friendly slug
	 */
	private static async generateUniqueSlug(title: string, targetLanguage: string): Promise<string> {
		// Create base slug from title
		let baseSlug = title
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '') // Remove special chars
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/-+/g, '-') // Collapse multiple hyphens
			.replace(/^-+|-+$/g, ''); // Trim hyphens from ends

		// Add language prefix
		const slugWithPrefix = `${targetLanguage}-${baseSlug}`;

		// Check if slug exists
		const existing = await learningPathRepository.findPublicTemplateBySlug(slugWithPrefix);

		if (!existing) {
			return slugWithPrefix;
		}

		// Slug exists, append random suffix
		const uniqueSuffix = nanoid(6).toLowerCase();
		const uniqueSlug = `${slugWithPrefix}-${uniqueSuffix}`;

		logger.info('🔄 [TemplatePublishing] Slug collision detected, using unique suffix', {
			original: slugWithPrefix,
			unique: uniqueSlug
		});

		return uniqueSlug;
	}
}
