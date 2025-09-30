// 🧬 Cultural DNA Store
// State management for the viral Cultural DNA assessment experience

import type { Language } from '$lib/server/db/types';
import type {
	DNAAssessmentSession,
	ScenarioResponse,
	CulturalDNA,
	ViralScenario
} from '../types/cultural-dna.types';
import { viralScenarios } from '../data/viral-scenarios';

class CulturalDNAStore {
	// Current assessment session
	currentSession = $state<DNAAssessmentSession | null>(null);

	// Assessment state
	isAssessing = $state(false);
	isAnalyzing = $state(false);

	// Results
	dnaResults = $state<CulturalDNA | null>(null);

	// Error handling
	error = $state<string | null>(null);

	// Start a new DNA assessment
	startAssessment(selectedLanguage: Language): DNAAssessmentSession {
		const session: DNAAssessmentSession = {
			sessionId: crypto.randomUUID(),
			currentScenario: 0,
			totalScenarios: viralScenarios.length,
			selectedLanguage,
			responses: [],
			startTime: new Date(),
			isComplete: false
		};

		this.currentSession = session;
		this.isAssessing = true;
		this.error = null;

		console.log('🧬 Started Cultural DNA assessment:', session.sessionId);
		return session;
	}

	// Get current scenario
	getCurrentScenario(): ViralScenario | null {
		if (!this.currentSession) return null;
		return viralScenarios[this.currentSession.currentScenario] || null;
	}

	// Add response to current scenario
	addScenarioResponse(response: Omit<ScenarioResponse, 'scenarioId'>): void {
		if (!this.currentSession) {
			this.error = 'No active assessment session';
			return;
		}

		const currentScenario = this.getCurrentScenario();
		if (!currentScenario) {
			this.error = 'Invalid scenario';
			return;
		}

		const fullResponse: ScenarioResponse = {
			...response,
			scenarioId: currentScenario.id
		};

		this.currentSession.responses.push(fullResponse);
		console.log(
			'🎭 Added scenario response:',
			currentScenario.id,
			response.audioTranscript.substring(0, 50)
		);
	}

	// Move to next scenario
	nextScenario(): boolean {
		if (!this.currentSession) return false;

		this.currentSession.currentScenario++;

		// Check if assessment is complete
		if (this.currentSession.currentScenario >= this.currentSession.totalScenarios) {
			this.completeAssessment();
			return false;
		}

		return true;
	}

	// Complete the assessment and trigger analysis
	completeAssessment(): void {
		if (!this.currentSession) return;

		this.currentSession.isComplete = true;
		this.isAssessing = false;
		this.isAnalyzing = true;

		console.log('🧬 Assessment complete, starting analysis...');

		// Import and run analysis
		import('../services/dna-analysis.service')
			.then(({ analyzeCulturalDNA }) => {
				if (this.currentSession) {
					this.dnaResults = analyzeCulturalDNA(this.currentSession);
					this.isAnalyzing = false;
					console.log('✨ DNA analysis complete:', this.dnaResults?.personalityType);
				}
			})
			.catch((err) => {
				this.error = 'Failed to analyze DNA: ' + err.message;
				this.isAnalyzing = false;
			});
	}

	// Get assessment progress
	getProgress(): { current: number; total: number; percentage: number } {
		if (!this.currentSession) {
			return { current: 0, total: 0, percentage: 0 };
		}

		return {
			current: this.currentSession.currentScenario,
			total: this.currentSession.totalScenarios,
			percentage: Math.round(
				(this.currentSession.currentScenario / this.currentSession.totalScenarios) * 100
			)
		};
	}

	// Reset store state
	reset(): void {
		this.currentSession = null;
		this.isAssessing = false;
		this.isAnalyzing = false;
		this.dnaResults = null;
		this.error = null;
		console.log('🧬 Cultural DNA store reset');
	}

	// Clear error
	clearError(): void {
		this.error = null;
	}

	// Share DNA results
	async shareResults(
		platform: 'instagram' | 'tiktok' | 'twitter' | 'whatsapp' | 'link'
	): Promise<string> {
		if (!this.dnaResults) {
			throw new Error('No DNA results to share');
		}

		// Import sharing service
		const { generateShareLink } = await import('../services/viral-sharing.service');
		return generateShareLink(this.dnaResults, platform);
	}

	// Load DNA results from ID (for shared links)
	async loadSharedResults(dnaId: string): Promise<CulturalDNA | null> {
		try {
			// This would typically fetch from a database
			// For now, return null - implement based on your backend
			console.log('🔗 Loading shared DNA results:', dnaId);
			return null;
		} catch (_err) {
			console.error('Failed to load shared results', _err);
			this.error = 'Failed to load shared results';
			return null;
		}
	}
}

// Export singleton instance
export const culturalDNAStore = new CulturalDNAStore();
