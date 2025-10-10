// Standardized API Response Types
// This ensures consistent response structure across all API endpoints

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	timestamp: string;
	requestId?: string;
}

export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
	success: true;
	data: T;
	message?: string;
}

export interface ErrorResponse extends ApiResponse {
	success: false;
	error: string;
}

export interface PaginatedResponse<T = unknown> extends SuccessResponse<T[]> {
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Helper functions for creating standardized responses
export function createSuccessResponse<T>(
	data: T,
	message?: string,
	requestId?: string
): SuccessResponse<T> {
	return {
		success: true,
		data,
		message,
		timestamp: new Date().toISOString(),
		...(requestId && { requestId })
	};
}

export function createErrorResponse(error: string, requestId?: string): ErrorResponse {
	return {
		success: false,
		error,
		timestamp: new Date().toISOString(),
		...(requestId && { requestId })
	};
}

export function createPaginatedResponse<T>(
	data: T[],
	pagination: {
		page: number;
		limit: number;
		total: number;
	},
	message?: string,
	requestId?: string
): PaginatedResponse<T> {
	const totalPages = Math.ceil(pagination.total / pagination.limit);

	return {
		success: true,
		data,
		message,
		timestamp: new Date().toISOString(),
		...(requestId && { requestId }),
		pagination: {
			...pagination,
			totalPages,
			hasNext: pagination.page < totalPages,
			hasPrev: pagination.page > 1
		}
	};
}

// Common API response patterns
export interface ConversationResponse {
	id: string;
	userId: string | null;
	guestId: string | null;
	targetLanguageId: string;
	title: string | null;
	mode: 'traditional' | 'realtime';
	voice: string | null;
	scenarioId: string | null;
	isOnboarding: string;
	startedAt: string;
	endedAt: string | null;
	durationSeconds: number | null;
	messageCount: number | null;
	audioSeconds: string | null;
	comfortRating: number | null;
	engagementLevel: 'low' | 'medium' | 'high' | null;
}

export interface MessageResponse {
	id: string;
	conversationId: string;
	role: 'assistant' | 'user' | 'system';
	content: string;
	timestamp: string;
	audioUrl: string | null;
}

export interface ConversationSessionResponse {
	id: string;
	userId: string;
	language: string;
	startTime: string;
	endTime: string | null;
	durationSeconds: number;
	secondsConsumed: number;
	inputTokens: number;
	wasExtended: boolean;
	extensionsUsed: number;
	transcriptionMode: boolean;
	deviceType: string | null;
	createdAt: string;
}
