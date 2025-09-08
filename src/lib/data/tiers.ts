// 🏆 Client-side Tier Access (safe subset)
// This file provides a client-safe mirror of tier configurations.
// DO NOT import server modules here. Only expose non-sensitive fields.

import type { Tier } from "$lib/server/db/types";

export type UserTier = 'free' | 'plus' | 'premium';

 

// Client-safe defaults (mirrors server values, without Stripe IDs)
export const defaultTierConfigs: Record<UserTier, Tier> = {
  free: {
    id: 'free',
    name: 'Basic',
    description: 'Perfect for trying out Kaiwa',
    monthlyConversations: 100,
    monthlySeconds: 900,
    monthlyRealtimeSessions: 100,
    maxSessionLengthSeconds: 180,
    sessionBankingEnabled: false,
    maxBankedSeconds: 0,
    hasRealtimeAccess: true,
    hasAdvancedVoices: false,
    hasAnalytics: false,
    hasCustomPhrases: false,
    hasConversationMemory: true,
    hasAnkiExport: false,
    monthlyPriceUsd: '0',
    annualPriceUsd: '0',
    conversationTimeoutSeconds: 3 * 60,
    warningThresholdSeconds: 30,
    canExtend: false,
    maxExtensions: 0,
    extensionDurationSeconds: 0,
    overagePricePerMinuteInCents: 10,
    feedbackSessionsPerMonth: '100',
    customizedPhrasesFrequency: 'weekly',
    conversationMemoryLevel: 'basic'
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    description: 'For serious language learners',
    monthlyConversations: 100,
    monthlySeconds: 18000,
    monthlyRealtimeSessions: 100,
    maxSessionLengthSeconds: 600,
    sessionBankingEnabled: true,
    maxBankedSeconds: 6000,
    hasRealtimeAccess: true,
    hasAdvancedVoices: true,
    hasAnalytics: true,
    hasCustomPhrases: true,
    hasConversationMemory: true,
    hasAnkiExport: true,
    monthlyPriceUsd: '15.00',
    annualPriceUsd: '144.00',
    conversationTimeoutSeconds: 10 * 60,
    warningThresholdSeconds: 60,
    canExtend: true,
    maxExtensions: 3,
    extensionDurationSeconds: 5 * 60,
    overagePricePerMinuteInCents: 8,
    feedbackSessionsPerMonth: 'unlimited',
    customizedPhrasesFrequency: 'daily',
    conversationMemoryLevel: 'human-like'
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'For power users who want more practice time',
    monthlyConversations: 100,
    monthlySeconds: 36000,
    monthlyRealtimeSessions: 100,
    maxSessionLengthSeconds: 600,
    sessionBankingEnabled: true,
    maxBankedSeconds: 12000,
    hasRealtimeAccess: true,
    hasAdvancedVoices: true,
    hasAnalytics: true,
    hasCustomPhrases: true,
    hasConversationMemory: true,
    hasAnkiExport: true,
    monthlyPriceUsd: '25.00', // display only; real prices fetched from backend/Stripe
    annualPriceUsd: '240.00',
    conversationTimeoutSeconds: 10 * 60,
    warningThresholdSeconds: 60,
    canExtend: true,
    maxExtensions: 5,
    extensionDurationSeconds: 5 * 60,
    overagePricePerMinuteInCents: 5,
    feedbackSessionsPerMonth: 'unlimited',
    customizedPhrasesFrequency: 'daily',
    conversationMemoryLevel: 'elephant-like'
  }
};

// Client helpers (safe)
export function getTierConfig(tierId: UserTier): Tier {
  return defaultTierConfigs[tierId];
}

export function getTimerSettings(tierId: UserTier) {
  const t = defaultTierConfigs[tierId];
  if (!t) return null;
  return {
    timeoutMs: t.conversationTimeoutSeconds,
    warningThresholdMs: t.warningThresholdSeconds,
    extendable: t.canExtend,
    maxExtensions: t.maxExtensions,
    extensionDurationMs: t.extensionDurationSeconds
  };
}

export function canExtendConversation(tierId: UserTier): boolean {
  return !!defaultTierConfigs[tierId]?.canExtend;
}

export function getConversationTimeout(tierId: UserTier): number {
  return (defaultTierConfigs[tierId]?.conversationTimeoutSeconds || 0) * 1000;
}

export function getWarningThreshold(tierId: UserTier): number {
  return (defaultTierConfigs[tierId]?.warningThresholdSeconds || 0) * 1000;
}

export function getMaxSessionLength(tierId: UserTier): number {
  return defaultTierConfigs[tierId]?.maxSessionLengthSeconds || 0;
}

export function getMonthlySeconds(tierId: UserTier): number {
  return defaultTierConfigs[tierId]?.monthlySeconds || 0;
}

export function hasSessionBanking(tierId: UserTier): boolean {
  return !!defaultTierConfigs[tierId]?.sessionBankingEnabled;
}

export function getMaxBankedSeconds(tierId: UserTier): number {
  return defaultTierConfigs[tierId]?.maxBankedSeconds || 0;
}

// NOTE: Stripe product/price IDs and any sensitive mapping SHOULD come from the backend.
// For Stripe price IDs, use `$lib/data/stripe` or fetch `/api/pricing` and Stripe endpoints.
// Intentionally not exposing getTierByStripePriceId / getTierByStripeProductId on the client.
