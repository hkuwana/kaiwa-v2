// 📊 Assessment Logic for Learning Scenarios
// Evaluates user performance and provides detailed feedback

import type {
	LearningScenario,
	ScenarioOutcome,
	VocabularyAssessment,
	GrammarAssessment,
	GoalAssessment,
	AssessmentConfig
} from './learning.js';
import { defaultAssessmentConfig } from './learning.js';

// 🎯 Core Assessment Engine
export class ScenarioAssessmentEngine {
	private config: AssessmentConfig;

	constructor(config: AssessmentConfig = defaultAssessmentConfig) {
		this.config = config;
	}

	// 🎯 Assess a complete scenario session
	assessScenario(
		scenario: LearningScenario,
		userTranscripts: string[],
		goalCompleted: boolean,
		durationSeconds: number,
		exchangeCount: number
	): ScenarioOutcome {
		// Analyze vocabulary usage
		const vocabularyAssessment = this.assessVocabulary(scenario, userTranscripts);
		const vocabularyScore = this.calculateVocabularyScore(vocabularyAssessment);

		// Analyze grammar usage
		const grammarAssessment = this.assessGrammar(scenario, userTranscripts);
		const grammarScore = this.calculateGrammarScore(grammarAssessment);

		// Analyze goal completion
		const goalAssessment = this.assessGoalCompletion(scenario, userTranscripts, goalCompleted);
		const goalScore = this.calculateGoalScore(goalAssessment);

		// Calculate overall scores
		const overallScore = this.calculateOverallScore({
			vocabulary: vocabularyScore,
			grammar: grammarScore,
			goalCompletion: goalScore,
			pronunciation: 0.8 // Placeholder - would come from speech recognition
		});

		// Generate AI feedback
		const aiFeedback = this.generateAIFeedback(
			scenario,
			vocabularyAssessment,
			grammarAssessment,
			goalAssessment,
			overallScore
		);

		// Generate improvement suggestions
		const suggestions = this.generateSuggestions(
			scenario,
			vocabularyAssessment,
			grammarAssessment,
			goalAssessment
		);

		return {
			wasGoalAchieved: goalCompleted,
			goalCompletionScore: goalScore.toString(),
			grammarUsageScore: grammarScore.toString(),
			vocabularyUsageScore: vocabularyScore.toString(),
			pronunciationScore: '0.80', // Placeholder
			usedTargetVocabulary: vocabularyAssessment.filter((v) => v.wasUsed).map((v) => v.word),
			missedTargetVocabulary: vocabularyAssessment.filter((v) => !v.wasUsed).map((v) => v.word),
			grammarErrors: grammarAssessment.filter((g) => g.accuracy < 0.7).flatMap((g) => g.errors),
			aiFeedback,
			suggestions,
			durationSeconds,
			exchangeCount
		};
	}

	// 📚 Assess vocabulary usage
	private assessVocabulary(
		scenario: LearningScenario,
		userTranscripts: string[]
	): VocabularyAssessment[] {
		const allText = userTranscripts.join(' ').toLowerCase();
		const assessments: VocabularyAssessment[] = [];

		if (!scenario.targetVocabulary) return [];
		for (const word of scenario.targetVocabulary) {
			const wordLower = word.toLowerCase();
			const wasUsed = allText.includes(wordLower);
			const wasUsedCorrectly = this.assessWordUsageCorrectness(word, allText);

			assessments.push({
				word,
				wasUsed,
				wasUsedCorrectly,
				context: this.extractWordContext(word, userTranscripts),
				score: wasUsed && wasUsedCorrectly ? 1.0 : wasUsed ? 0.5 : 0.0
			});
		}

		return assessments;
	}

	// 🔤 Assess grammar usage
	private assessGrammar(
		scenario: LearningScenario,
		userTranscripts: string[]
	): GrammarAssessment[] {
		const assessments: GrammarAssessment[] = [];

		if (scenario.targetGrammar) {
			const patterns = this.parseGrammarPatterns(scenario.targetGrammar);

			for (const pattern of patterns) {
				const wasDemonstrated = this.checkGrammarPattern(pattern, userTranscripts);
				const accuracy = this.assessGrammarAccuracy(pattern, userTranscripts);
				const examples = this.extractGrammarExamples(pattern, userTranscripts);
				const errors = this.extractGrammarErrors(pattern, userTranscripts);

				assessments.push({
					pattern,
					wasDemonstrated,
					accuracy,
					examples,
					errors
				});
			}
		}

		return assessments;
	}

	// 🎯 Assess goal completion
	private assessGoalCompletion(
		scenario: LearningScenario,
		userTranscripts: string[],
		goalCompleted: boolean
	): GoalAssessment[] {
		const assessments: GoalAssessment[] = [];

		if (!scenario.successCriteria) return [];
		for (const step of scenario.successCriteria.goalSteps) {
			const wasCompleted = this.checkGoalStepCompletion(step, userTranscripts);
			const completionMethod = this.extractCompletionMethod(step, userTranscripts);
			const score = wasCompleted ? 1.0 : 0.0;

			assessments.push({
				step,
				wasCompleted,
				completionMethod,
				score
			});
		}

		return assessments;
	}

	// 📊 Calculate individual scores
	private calculateVocabularyScore(assessments: VocabularyAssessment[]): number {
		if (assessments.length === 0) return 0.0;

		const totalScore = assessments.reduce((sum, assessment) => sum + assessment.score, 0);
		return totalScore / assessments.length;
	}

	private calculateGrammarScore(assessments: GrammarAssessment[]): number {
		if (assessments.length === 0) return 0.0;

		const totalScore = assessments.reduce((sum, assessment) => sum + assessment.accuracy, 0);
		return totalScore / assessments.length;
	}

	private calculateGoalScore(assessments: GoalAssessment[]): number {
		if (assessments.length === 0) return 0.0;

		const totalScore = assessments.reduce((sum, assessment) => sum + assessment.score, 0);
		return totalScore / assessments.length;
	}

	// 🎯 Calculate overall score
	private calculateOverallScore(scores: {
		vocabulary: number;
		grammar: number;
		goalCompletion: number;
		pronunciation: number;
	}): number {
		return (
			scores.vocabulary * this.config.vocabularyWeight +
			scores.grammar * this.config.grammarWeight +
			scores.goalCompletion * this.config.goalCompletionWeight +
			scores.pronunciation * this.config.pronunciationWeight
		);
	}

	// 🤖 Generate AI feedback
	private generateAIFeedback(
		scenario: LearningScenario,
		vocabularyAssessment: VocabularyAssessment[],
		grammarAssessment: GrammarAssessment[],
		goalAssessment: GoalAssessment[],
		overallScore: number
	): string {
		const feedbackParts: string[] = [];

		// Overall performance
		if (overallScore >= this.config.excellentScore) {
			feedbackParts.push(
				'Excellent work! You successfully completed this scenario with great language skills.'
			);
		} else if (overallScore >= this.config.passingScore) {
			feedbackParts.push(
				'Good job! You completed the main goal and demonstrated solid language skills.'
			);
		} else {
			feedbackParts.push(
				"You're making progress! Let's work on improving a few areas to master this scenario."
			);
		}

		// Vocabulary feedback
		const usedWords = vocabularyAssessment.filter((v) => v.wasUsed).length;
		const totalWords = vocabularyAssessment.length;
		if (usedWords === totalWords) {
			feedbackParts.push('You used all the target vocabulary perfectly!');
		} else if (usedWords >= totalWords * 0.7) {
			feedbackParts.push(
				`Great vocabulary usage! You used ${usedWords} out of ${totalWords} target words.`
			);
		} else {
			feedbackParts.push(
				`Try to incorporate more of the target vocabulary. You used ${usedWords} out of ${totalWords} words.`
			);
		}

		// Grammar feedback
		if (grammarAssessment.length > 0) {
			const avgGrammarScore =
				grammarAssessment.reduce((sum, g) => sum + g.accuracy, 0) / grammarAssessment.length;
			if (avgGrammarScore >= 0.8) {
				feedbackParts.push('Your grammar usage was very accurate!');
			} else if (avgGrammarScore >= 0.6) {
				feedbackParts.push('Good grammar overall, with room for improvement.');
			} else {
				feedbackParts.push('Focus on practicing the target grammar patterns more.');
			}
		}

		// Goal completion feedback
		const completedSteps = goalAssessment.filter((g) => g.wasCompleted).length;
		const totalSteps = goalAssessment.length;
		if (completedSteps === totalSteps) {
			feedbackParts.push('You successfully completed all the goal steps!');
		} else {
			feedbackParts.push(
				`You completed ${completedSteps} out of ${totalSteps} goal steps. Keep practicing!`
			);
		}

		return feedbackParts.join(' ');
	}

	// 💡 Generate improvement suggestions
	private generateSuggestions(
		scenario: LearningScenario,
		vocabularyAssessment: VocabularyAssessment[],
		grammarAssessment: GrammarAssessment[],
		goalAssessment: GoalAssessment[]
	): string[] {
		const suggestions: string[] = [];

		// Vocabulary suggestions
		const missedWords = vocabularyAssessment.filter((v) => !v.wasUsed);
		if (missedWords.length > 0) {
			suggestions.push(`Practice using these words: ${missedWords.map((v) => v.word).join(', ')}`);
		}

		// Grammar suggestions
		const weakGrammar = grammarAssessment.filter((g) => g.accuracy < 0.7);
		if (weakGrammar.length > 0) {
			suggestions.push(`Focus on practicing: ${weakGrammar.map((g) => g.pattern).join(', ')}`);
		}

		// Goal completion suggestions
		const incompleteSteps = goalAssessment.filter((g) => !g.wasCompleted);
		if (incompleteSteps.length > 0) {
			suggestions.push(`Work on completing: ${incompleteSteps.map((g) => g.step).join(', ')}`);
		}

		// General suggestions
		if (suggestions.length === 0) {
			suggestions.push('Great job! Try this scenario again to improve your speed and fluency.');
		}

		return suggestions;
	}

	// 🔍 Helper methods for detailed assessment
	private assessWordUsageCorrectness(word: string, text: string): boolean {
		// Simple check - could be enhanced with NLP
		return text.includes(word.toLowerCase());
	}

	private extractWordContext(word: string, transcripts: string[]): string {
		for (const transcript of transcripts) {
			if (transcript.toLowerCase().includes(word.toLowerCase())) {
				return transcript;
			}
		}
		return 'Word not found in transcripts';
	}

	private parseGrammarPatterns(grammarDescription: string): string[] {
		// Parse grammar patterns from description
		// This is a simplified version - could be enhanced with NLP
		return grammarDescription.split(',').map((p) => p.trim());
	}

	private checkGrammarPattern(pattern: string, transcripts: string[]): boolean {
		// Check if grammar pattern is demonstrated
		// This is a simplified version - could be enhanced with NLP
		const allText = transcripts.join(' ').toLowerCase();
		return allText.includes(pattern.toLowerCase());
	}

	private assessGrammarAccuracy(pattern: string, transcripts: string[]): number {
		// Assess grammar accuracy (simplified)
		// This would typically use NLP for more accurate assessment
		return this.checkGrammarPattern(pattern, transcripts) ? 0.8 : 0.3;
	}

	private extractGrammarExamples(pattern: string, transcripts: string[]): string[] {
		// Extract examples of grammar usage
		const examples: string[] = [];
		for (const transcript of transcripts) {
			if (transcript.toLowerCase().includes(pattern.toLowerCase())) {
				examples.push(transcript);
			}
		}
		return examples;
	}

	private extractGrammarErrors(pattern: string, transcripts: string[]): string[] {
		// Extract grammar errors (simplified)
		// This would typically use NLP for more accurate error detection
		return [];
	}

	private checkGoalStepCompletion(step: string, transcripts: string[]): boolean {
		// Check if goal step was completed
		const allText = transcripts.join(' ').toLowerCase();
		const stepKeywords = step.toLowerCase().split(' ');
		return stepKeywords.some((keyword) => allText.includes(keyword));
	}

	private extractCompletionMethod(step: string, transcripts: string[]): string {
		// Extract how the goal step was completed
		for (const transcript of transcripts) {
			if (transcript.toLowerCase().includes(step.toLowerCase())) {
				return transcript;
			}
		}
		return 'Step not completed';
	}
}

// 🎯 Export assessment engine instance
export const assessmentEngine = new ScenarioAssessmentEngine();

// 🚀 Convenience function for quick assessment
export function assessScenario(
	scenario: LearningScenario,
	userTranscripts: string[],
	goalCompleted: boolean,
	durationSeconds: number,
	exchangeCount: number
): ScenarioOutcome {
	return assessmentEngine.assessScenario(
		scenario,
		userTranscripts,
		goalCompleted,
		durationSeconds,
		exchangeCount
	);
}
