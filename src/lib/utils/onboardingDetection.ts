/**
 * Utilities for detecting onboarding state and progress based on route and user data
 */

interface OnboardingState {
	currentStep: 'setup' | 'conversation' | 'analysis';
	completedSteps: string[];
	shouldShowProgress: boolean;
	suggestedVariant: 'minimal' | 'detailed' | 'floating';
}

interface UserContext {
	isGuest?: boolean;
	hasCompletedOnboarding?: boolean;
}

/**
 * Detects the current onboarding state based on the current path
 */
export function detectOnboardingState(
	pathname: string,
	userContext: UserContext = {}
): OnboardingState {
	const { isGuest = false, hasCompletedOnboarding = false } = userContext;

	// If user has completed onboarding and isn't a guest, don't show progress
	if (!isGuest && hasCompletedOnboarding) {
		return {
			currentStep: 'setup',
			completedSteps: [],
			shouldShowProgress: false,
			suggestedVariant: 'minimal'
		};
	}

	// Determine current step based on path
	let currentStep: OnboardingState['currentStep'] = 'setup';
	const completedSteps: string[] = [];

	if (pathname.startsWith('/conversation')) {
		currentStep = 'conversation';
		completedSteps.push('setup');
	} else if (pathname.startsWith('/analysis')) {
		currentStep = 'analysis';
		completedSteps.push('setup', 'conversation');
	}

	// Determine if we should show progress (guests always see it during onboarding)
	const shouldShowProgress = isGuest || !hasCompletedOnboarding;

	// Suggest variant based on current step and context
	let suggestedVariant: OnboardingState['suggestedVariant'] = 'detailed';

	if (currentStep === 'conversation') {
		// During conversation, use floating to not interfere
		suggestedVariant = 'floating';
	} else if (currentStep === 'analysis') {
		// During analysis, minimal is less distracting
		suggestedVariant = 'minimal';
	} else if (pathname === '/') {
		// On homepage, detailed shows full value
		suggestedVariant = 'detailed';
	}

	return {
		currentStep,
		completedSteps,
		shouldShowProgress,
		suggestedVariant
	};
}

/**
 * Determines if the user is likely in the middle of onboarding flow
 */
export function isInOnboardingFlow(pathname: string, userContext: UserContext = {}): boolean {
	const { isGuest = false, hasCompletedOnboarding = false } = userContext;

	// Guests are always in onboarding until they complete it
	if (isGuest) {
		return true;
	}

	// Non-guests who haven't completed onboarding and are on relevant pages
	if (!hasCompletedOnboarding) {
		return (
			pathname === '/' ||
			pathname.startsWith('/conversation') ||
			pathname.startsWith('/analysis')
		);
	}

	return false;
}

/**
 * Gets retention message based on current onboarding state
 */
export function getRetentionMessage(
	currentStep: OnboardingState['currentStep'],
	isFirstTime: boolean = true
): string | null {
	if (!isFirstTime) return null;

	const messages = {
		setup: "Don't worry, the conversation is just 5 minutes!",
		conversation: "Almost done! Your personalized analysis is being prepared...",
		analysis: "🎉 You've reached the wow moment! Share your results."
	};

	return messages[currentStep] || null;
}

/**
 * Predicts the next step in the onboarding flow
 */
export function getNextStep(
	currentStep: OnboardingState['currentStep']
): { step: string; title: string; description: string } | null {
	const nextSteps = {
		setup: {
			step: 'conversation',
			title: 'Practice',
			description: 'Real conversation practice'
		},
		conversation: {
			step: 'analysis',
			title: 'Analysis',
			description: 'Personalized insights & feedback'
		},
		analysis: null
	};

	return nextSteps[currentStep] || null;
}

/**
 * Determines optimal placement for progress indicators
 */
export function getProgressPlacement(pathname: string): {
	showInHeader: boolean;
	showAsFloating: boolean;
	showInline: boolean;
} {
	// Conversation pages should use floating to avoid interference
	if (pathname.startsWith('/conversation')) {
		return {
			showInHeader: false,
			showAsFloating: true,
			showInline: false
		};
	}

	// Analysis pages can show minimal in header
	if (pathname.startsWith('/analysis')) {
		return {
			showInHeader: true,
			showAsFloating: false,
			showInline: false
		};
	}

	// Homepage and setup can show detailed inline
	return {
		showInHeader: false,
		showAsFloating: false,
		showInline: true
	};
}