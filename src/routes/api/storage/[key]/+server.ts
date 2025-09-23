import { json } from '@sveltejs/kit';

// Simple in-memory storage for MVP (replace with database later)
const storage = new Map<string, unknown>();

export const GET = async ({ params }) => {
	try {
		const { key } = params;

		if (!key) {
			return json({ error: 'Key is required' }, { status: 400 });
		}

		const data = storage.get(key);

		if (data === undefined) {
			return json({ error: 'Not found' }, { status: 404 });
		}

		return json(data);
	} catch (error) {
		console.error('Storage load error:', error);
		return json({ error: 'Failed to load data' }, { status: 500 });
	}
};

export const DELETE = async ({ params }) => {
	try {
		const { key } = params;

		if (!key) {
			return json({ error: 'Key is required' }, { status: 400 });
		}

		storage.delete(key);
		return json({ success: true });
	} catch (error) {
		console.error('Storage delete error:', error);
		return json({ error: 'Failed to delete data' }, { status: 500 });
	}
};
