import { getAllBlogPosts, paginatePosts } from '$lib/blog/utils/blogIndex.js';
import { createBlogListSeo } from '$lib/blog/utils/blogSeo.js';

export const load = async ({ parent, url }) => {
	const { seo } = await parent();
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const postsPerPage = 9;

	const allPosts = await getAllBlogPosts();
	const paginatedData = paginatePosts(allPosts, page, postsPerPage);

	const blogSeo = createBlogListSeo(url.origin);

	return {
		...paginatedData,
		seo: { ...seo, ...blogSeo }
	};
};
