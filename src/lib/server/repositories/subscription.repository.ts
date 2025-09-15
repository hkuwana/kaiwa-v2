// src/lib/server/repositories/subscription.repository.ts

import { db } from '$lib/server/db/index';
import { subscriptions } from '$lib/server/db/schema';
import type { UserTier, Subscription, NewSubscription } from '$lib/server/db/types';
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
    },

    async findSubscriptionByUserId(userId: string): Promise<Subscription | null> {
        try {
            const subscription = await db.query.subscriptions.findFirst({
                where: eq(subscriptions.userId, userId)
            });
            return subscription || null;
        } catch (error) {
            console.error('Error fetching subscription from DB:', error);
            return null;
        }
    },

    async findSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
        try {
            const subscriptionList = await db
                .select()
                .from(subscriptions)
                .where(eq(subscriptions.userId, userId))
                .orderBy(desc(subscriptions.createdAt));
            return subscriptionList;
        } catch (error) {
            console.error('Error fetching subscriptions from DB:', error);
            return [];
        }
    },

    async findSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
        try {
            const subscription = await db.query.subscriptions.findFirst({
                where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)
            });
            return subscription || null;
        } catch (error) {
            console.error('Error fetching subscription from DB:', error);
            return null;
        }
    },

    async createSubscription(newSubscription: NewSubscription): Promise<Subscription> {
        const [createdSubscription] = await db.insert(subscriptions).values(newSubscription).returning();
        return createdSubscription;
    },

    async updateSubscription(id: string, data: Partial<NewSubscription>): Promise<Subscription | undefined> {
        const [updatedSubscription] = await db.update(subscriptions).set(data).where(eq(subscriptions.id, id)).returning();
        return updatedSubscription;
    },

    async upsertSubscription(
        userId: string,
        stripeSubscriptionId: string,
        stripePriceId: string,
        currentTier: UserTier
    ) {
        try {
            // Check if subscription exists
            const existing = await db.query.subscriptions.findFirst({
                where: eq(subscriptions.userId, userId)
            });

            if (existing) {
                // Update existing
                await db
                    .update(subscriptions)
                    .set({
                        stripeSubscriptionId,
                        stripePriceId,
                        currentTier,
                        updatedAt: new Date()
                    })
                    .where(eq(subscriptions.userId, userId));
            } else {
                // Create new
                await db.insert(subscriptions).values({
                    userId,
                    stripeSubscriptionId,
                    stripePriceId,
                    currentTier
                });
            }

            return true;
        } catch (error) {
            console.error('Error updating subscription in DB:', error);
            return false;
        }
    }
};