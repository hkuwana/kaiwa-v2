import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { createErrorResponse, createSuccessResponse } from '$lib/types/api';
import { getUserFromSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const userId = await getUserFromSession(cookies);
    if (!userId) {
      return json(createErrorResponse('Authentication required'), { status: 401 });
    }

    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
    const languageId = url.searchParams.get('languageId') || undefined;

    const conversations = await conversationRepository.findConversationsByUserId(userId, limit, 0);

    const filtered = languageId
      ? conversations.filter((c) => c.targetLanguageId === languageId)
      : conversations;

    // Sanitize payload
    const payload = filtered.map((c) => ({
      id: c.id,
      title: c.title,
      targetLanguageId: c.targetLanguageId,
      scenarioId: c.scenarioId,
      isOnboarding: c.isOnboarding,
      startedAt: c.startedAt?.toISOString?.() || c.startedAt,
      endedAt: c.endedAt ? (c.endedAt as Date).toISOString?.() || c.endedAt : null,
      durationSeconds: c.durationSeconds,
      messageCount: c.messageCount
    }));

    return json(createSuccessResponse({ conversations: payload }));
  } catch (error) {
    console.error('Get conversations API error:', error);
    return json(createErrorResponse('Internal server error'), { status: 500 });
  }
};

