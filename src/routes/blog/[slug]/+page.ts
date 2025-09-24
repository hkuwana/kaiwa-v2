import { error } from '@sveltejs/kit';
import { getBlogPost, getRelatedPosts, getAllBlogPosts } from '$lib/blog/utils/blogIndex.js';
import { createBlogSeo } from '$lib/blog/utils/blogSeo.js';
import { calculateReadingTime } from '$lib/blog/utils/blogProcessor.js';

export const load = async ({ params, parent, url }) => {
	const { slug } = params;
	const { seo } = await parent();

	const post = await getBlogPost(slug);

	if (!post) {
		throw error(404, `Blog post "${slug}" not found`);
	}

	// Calculate reading time if not provided
	if (!post.metadata.readTime) {
		// Get raw content from the module to calculate reading time
		try {
			const module = await import(`../../../lib/blog/posts/${slug}.md?raw`);
			const rawContent = module.default;
			post.metadata.readTime = calculateReadingTime(rawContent);
		} catch {
			post.metadata.readTime = '5 min read';
		}
	}

	// Get related posts
	const allPosts = await getAllBlogPosts();
	const relatedPosts = getRelatedPosts(post, allPosts, 3);

	// Create enhanced SEO data
	const postSeo = createBlogSeo(post.metadata, slug, url.origin);

	return {
		post,
		relatedPosts,
		seo: { ...seo, ...postSeo }
	};
};
