// Load function for the page
export const load = async ({ fetch }) => {
	try {
		const res = await fetch('/dev/pab-invite');
		const data = await res.json();
		return {
			candidates: data.candidates || []
		};
	} catch (error) {
		console.error('Error loading PAB candidates:', error);
		return {
			candidates: []
		};
	}
};
