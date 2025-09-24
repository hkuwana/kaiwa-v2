import { getAllBlogPosts, generateRssFeed } from '$lib/blog/utils/blogIndex.js';

export const GET = async () => {
	const posts = await getAllBlogPosts();
	const rss = generateRssFeed(posts);

	return new Response(rss, {
		headers: {
			'Content-Type': 'application/rss+xml'
		}
	});
};
