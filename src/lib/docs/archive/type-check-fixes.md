# TypeScript and Svelte Check Error Triage

This document lists the errors and warnings found by `pnpm check` and prioritizes them for fixing.

## High Priority: Breaking Errors

These errors are likely to cause the application to fail at runtime or lead to significant bugs. They should be addressed first.

### 1. Missing Module or Type Declarations

These errors indicate that dependencies are either not installed or their type definitions are missing.

- [ ] **@aws-sdk/client-s3:** `Cannot find module '@aws-sdk/client-s3' or its corresponding type declarations.` in `src/lib/server/services/audio-storage.service.ts`
- [ ] **@aws-sdk/s3-request-presigner:** `Cannot find module '@aws-sdk/s3-request-presigner' or its corresponding type declarations.` in `src/lib/server/services/audio-storage.service.ts`
- [ ] **echogarden:** `Cannot find module 'echogarden' or its corresponding type declarations.` in `src/lib/features/analysis/modules/pronunciation-analysis.module.ts`
- [ ] **../types/analysis-suggestion.types:** `Cannot find module '../types/analysis-suggestion.types' or its corresponding type declarations.` in `src/lib/archive/features/analysis/components/ConversationSuggestionsPreview.svelte` and `src/lib/archive/features/analysis/components/MessageWithSuggestions.svelte`
- [ ] **../services/analysis.service:** `Cannot find module '../services/analysis.service' or its corresponding type declarations.` in `src/lib/archive/features/analysis/components/ConversationSuggestionsPreview.svelte` and `src/lib/archive/features/analysis/components/MessageWithSuggestions.svelte`

### 2. Incorrect Type Assignments and Missing Properties

These are fundamental type mismatches that need to be addressed.

- [ ] **`conversation.repository.ts`:** `Object literal may only specify known properties, but 'audioDuration' does not exist in type...` and `Property 'speechTimings' does not exist on type...`. It seems `audioDuration` should be `audioDurationMs`. `speechTimings` is also not a valid property.
- [ ] **`stripe.service.ts`:** `Type 'Status' is not assignable to type '"pending" | ...'`. The status from the Stripe API needs to be mapped to the internal status type.
- [ ] **`message.service.ts`:** Multiple errors of `Object literal may only specify known properties, and 'speechTimings' does not exist...`.
- [ ] **`user-preferences.ts`:** `Property 'audioInputMode' is missing in type...`. The `defaultUserPreference` object is missing a required property.
- [ ] **`realtime-openai.store.svelte.ts`:** `Object literal may only specify known properties, and 'speechTimings' does not exist...`.
- [ ] **`pronunciation-analysis.module.ts`:** `Property 'audioUrl' does not exist on type...`, `Property 'audioStorageKey' does not exist on type...`, `Type 'string | undefined' is not assignable to type 'string'`.
- [ ] **`analysis-logbook.service.ts`:** `Type '{ userId: string | null; ... }[]' is not assignable to type '{ userId: string; ... }[]'`. `userId` and `languageId` can be null in the source but not in the destination.
- [ ] **`analysis.service.ts`:** `Object literal may only specify known properties, and 'results' does not exist in type 'AnalysisRunResult'`.
- [ ] **`analysis-suggestion.service.ts`:** `Property 'details' does not exist on type 'AnalysisResult'`.
- [ ] **`growth-playbook.service.ts`:** `Property 'results' does not exist on type 'AnalysisRunResult'`.
- [ ] **`tier-service.ts`:** `Type '{ ... }' is not assignable to type '{ ... }'`. The usage object is missing properties.
- [ ] **`weekly-updates-email.service.ts`:** `Type 'FeedbackFollowUpItem' is not assignable to type 'Record<string, unknown>'`.
- [ ] **`translation.service.ts`:** `Object literal may only specify known properties, but 'audioDuration' does not exist...`.
- [ ] **`marketing-automation.service.ts`:** `Element implicitly has an 'any' type because expression of type 'string' can't be used to index type...`.
- [ ] **`analysis.service.ts`:** `Type '"phrase-suggestions"' is not assignable to type 'AnalysisModuleId'`.
- [ ] **`realtime.service.ts`:** `Property 'turnDetection' does not exist on type 'RealtimeSessionConfig'`.
- [ ] **`assess-level/+server.ts`:** `Type '"language-level-assessment"' is not assignable to type 'AnalysisModuleId'`, and multiple properties do not exist on type `{}`.
- [ ] **`run/+server.ts`:** `Variable 'findingDrafts' implicitly has type 'any[]'`, and `Type '"advanced-grammar"' is not comparable to type 'AnalysisModuleId'`.
- [ ] **`conversations/+server.ts`:** `Argument of type 'typeToFlattenedError<...>' is not assignable to parameter of type 'string'`, and `Object literal may only specify known properties, but 'audioDuration' does not exist...`.
- [ ] **`[id]/messages/+server.ts`:** `Object literal may only specify known properties, but 'audioDuration' does not exist...`.
- [ ] **`VirtualizedMessageList.svelte`:** `Object literal may only specify known properties, and 'conversationLanguage' does not exist...`.
- [ ] **`InteractiveScenarioPreview.svelte`:** `Object literal may only specify known properties, but 'audioDuration' does not exist...`.
- [ ] **`analysis-test/+page.svelte`:** `Object literal may only specify known properties, but 'audioDuration' does not exist...`.
- [ ] **`assessment-test/+page.svelte`:** Multiple errors of `Object literal may only specify known properties, but 'audioDuration' does not exist...`.
- [ ] **`japanese-scripts/+page.svelte`:** `Object literal may only specify known properties, and '"conversationLanguage"' does not exist...`.
- [ ] **`messages/+page.svelte`:** Multiple errors of missing properties on message types.
- [ ] **`dev-messages/+page.svelte`:** Multiple errors of missing properties on message types.
- [ ] **`modals/+page.svelte`:** `Type '{ ... }' is missing the following properties from type '{ ... }'`.
- [ ] **`pricing-modal/+page.svelte`:** `Type '{ ... }' is missing the following properties from type '{ ... }'`.
- [ ] **`tiers/+page.svelte`:** `Type '{ ... }' is missing the following properties from type '{ ... }'`.
- [ ] **`usage-test/+page.svelte`:** `Type '{ ... }' is not assignable to type '{ ... }'`, and arithmetic operations on non-number types.

## Medium Priority: Potential Bugs & Data Integrity Issues

These errors might not crash the app immediately, but they point to potential bugs, incorrect data handling, or unexpected behavior.

- [ ] **`cron/founder-emails/+server.ts`:** Multiple errors of `'user' is possibly 'undefined'` and `'user.createdAt' is possibly 'null'`. These need null checks.
- [ ] **`growth-playbook.service.ts`:** `Parameter 'result' implicitly has an 'any' type`.
- [ ] **`run/+server.ts`:** `Variable 'findingDrafts' implicitly has type 'any[]'`.
- [ ] **`InteractiveScenarioPreview.svelte`:** `Argument of type 'unknown' is not assignable to parameter of type 'string'`.
- [ ] **`UnifiedConversationBubble.svelte`:** `Object is possibly 'undefined'`.
- [ ] **`competition-analysis/+page.svelte`:** Multiple errors of properties not existing on types.

## Low Priority: Svelte Warnings & Non-critical issues

These are warnings that don't break the application but should be fixed for code quality, accessibility, and to avoid potential issues in the future.

- [ ] **`AudioMessageBubble.svelte`:** `a11y_click_events_have_key_events` warning.
- [ ] **`ConversationSuggestionsPreview.svelte`:** `non_reactive_update` warning.
- [ ] **`AdvancedAudioOptions.svelte`:** `css_unused_selector` warning.
- [ ] **`ChatBubbleFlow.svelte`:** `non_reactive_update` warning.
- [ ] **`ConversationActiveState.svelte`:** `non_reactive_update` warning.
- [ ] **`guest-analysis/+page.svelte`:** `a11y_label_has_associated_control` warning.
- [ ] **`instructions/+page.svelte`:** Multiple `a11y_label_has_associated_control` warnings.
