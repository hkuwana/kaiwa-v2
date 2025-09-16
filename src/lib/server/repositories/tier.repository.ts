// src/lib/server/repositories/tier.repository.ts

import { db } from '$lib/server/db/index';
import { tiers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const tierRepository = {
  async getTierById(tierId: string) {
    const [row] = await db.select().from(tiers).where(eq(tiers.id, tierId));
    return row ?? null;
  }
};