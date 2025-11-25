// src/routes/program/[slug]/+page.server.ts

import { error } from '@sveltejs/kit';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import type { PageServerLoad } from './$types';

/**
 * Server-side load function for public learning path template pages
 *
 * Fetches a public template by its share slug and returns it for rendering.
 * This page is publicly accessible and SEO-optimized for discovery.
 *
 * Route: /program/[slug]
 * Example: /program/jp-meeting-partners-parents
 *
 * @returns Learning path template data or 404 error
 */
export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;

	// Fetch the public template by slug
	const template = await learningPathRepository.findPublicTemplateBySlug(slug);

	if (!template) {
		throw error(404, {
			message: 'Learning path not found',
			details: `The learning path "${slug}" does not exist or is not publicly available.`
		});
	}

	// Return template data for rendering
	return {
		template: {
			id: template.id,
			title: template.title,
			description: template.description,
			targetLanguage: template.targetLanguage,
			schedule: template.schedule,
			shareSlug: template.shareSlug,
			metadata: template.metadata,
			createdAt: template.createdAt.toISOString()
		}
	};
};
