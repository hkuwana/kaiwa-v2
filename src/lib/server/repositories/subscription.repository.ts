// src/lib/server/repositories/subscription.repository.ts

import { db } from '$lib/server/db/index';
import { subscriptions } from '$lib/server/db/schema';
import type { UserTier } from '$lib/server/db/types';
import { eq, desc } from 'drizzle-orm';

export const subscriptionRepository = {
    async getUserTier(userId: string): Promise<UserTier> {
        const rows = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .orderBy(desc(subscriptions.updatedAt))
            .limit(1);

        return (rows[0]?.currentTier as UserTier) || 'free';
    }
};
