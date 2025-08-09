// 🏠 Home Page Server Logic
// Passes user data to the client for authentication state

export const load = async ({ locals }) => {
	return {
		user: locals.user
	};
};
