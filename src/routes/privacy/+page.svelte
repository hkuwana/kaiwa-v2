<script lang="ts">
	import { onMount } from 'svelte';
	import { trackPageView } from '$lib/analytics/posthog';

	onMount(() => {
		trackPageView('/privacy');
	});
</script>

<svelte:head>
	<title>Privacy Policy - Kaiwa | Data Protection & Analytics</title>
	<meta
		name="description"
		content="Learn how Kaiwa collects, uses, and protects your data for language learning. Understand our data practices, PostHog analytics, and privacy protections."
	/>
	<meta
		name="keywords"
		content="privacy policy, data protection, language learning, PostHog analytics, user data, GDPR compliance"
	/>
	<meta name="author" content="Kaiwa" />
	<meta name="robots" content="index, follow" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://kaiwa.app/privacy" />
	<meta property="og:title" content="Privacy Policy - Kaiwa | Data Protection & Analytics" />
	<meta
		property="og:description"
		content="Learn how Kaiwa collects, uses, and protects your data for language learning. Understand our data practices, PostHog analytics, and privacy protections."
	/>
	<meta property="og:site_name" content="Kaiwa" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://kaiwa.app/privacy" />
	<meta property="twitter:title" content="Privacy Policy - Kaiwa | Data Protection & Analytics" />
	<meta
		property="twitter:description"
		content="Learn how Kaiwa collects, uses, and protects your data for language learning. Understand our data practices, PostHog analytics, and privacy protections."
	/>

	<!-- Canonical URL -->
	<link rel="canonical" href="https://kaiwa.app/privacy" />

	<!-- Structured Data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebPage",
			"name": "Privacy Policy - Kaiwa",
			"description": "Learn how Kaiwa collects, uses, and protects your data for language learning",
			"url": "https://kaiwa.app/privacy",
			"publisher": {
				"@type": "Organization",
				"name": "Kaiwa",
				"url": "https://kaiwa.app"
			},
			"dateModified": "2025-08-29"
		}
	</script>
</svelte:head>

<div class="privacy-container">
	<header class="privacy-header">
		<h1>Privacy Policy</h1>
		<p class="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
	</header>

	<div class="privacy-content">
		<section class="privacy-section">
			<h2>Introduction</h2>
			<p>
				Kaiwa ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
				explains how we collect, use, and safeguard your information when you use our language
				learning application.
			</p>
			<p>
				By using Kaiwa, you agree to the collection and use of information in accordance with this
				policy.
			</p>
		</section>

		<section class="privacy-section">
			<h2>Information We Collect</h2>

			<h3>Account Information</h3>
			<ul>
				<li><strong>Email address</strong> - Required for account creation and communication</li>
				<li><strong>Display name</strong> - Optional, for personalization</li>
				<li><strong>Google ID</strong> - If you sign up with Google authentication</li>
				<li><strong>Avatar URL</strong> - Optional profile picture</li>
			</ul>

			<h3>Language Learning Data</h3>
			<ul>
				<li><strong>Native language</strong> - Your primary language (defaults to English)</li>
				<li><strong>Target language</strong> - The language you're learning</li>
				<li><strong>Learning goals</strong> - Your motivation (career, travel, culture, etc.)</li>
				<li>
					<strong>Skill levels</strong> - Speaking, listening, reading, and writing proficiency (1-100
					scale)
				</li>
				<li><strong>Challenge preferences</strong> - How difficult you want lessons to be</li>
				<li><strong>Correction style</strong> - How you prefer to receive feedback</li>
			</ul>

			<h3>Conversation Data</h3>
			<ul>
				<li><strong>Conversation content</strong> - Text messages exchanged with AI tutors</li>
				<li><strong>Audio recordings</strong> - Your voice during real-time conversations</li>
				<li><strong>Transcription data</strong> - Speech-to-text conversion of your audio</li>
				<li>
					<strong>Language analysis</strong> - Grammar, vocabulary, and pronunciation feedback
				</li>
				<li><strong>Session metadata</strong> - Duration, message count, comfort ratings</li>
			</ul>

			<h3>Usage Analytics</h3>
			<ul>
				<li><strong>Study time</strong> - Total minutes spent learning</li>
				<li><strong>Conversation frequency</strong> - How often you practice</li>
				<li><strong>Feature usage</strong> - Which learning modes you prefer</li>
				<li><strong>Progress tracking</strong> - Skill level changes over time</li>
				<li><strong>Device information</strong> - Browser type, device type</li>
			</ul>

			<h3>Payment Information</h3>
			<ul>
				<li><strong>Stripe customer ID</strong> - For subscription management</li>
				<li><strong>Subscription details</strong> - Plan type, billing cycle, status</li>
				<li><strong>Payment history</strong> - Transaction amounts and dates</li>
			</ul>
		</section>

		<section class="privacy-section">
			<h2>How We Use Your Information</h2>

			<h3>Core Language Learning Features</h3>
			<ul>
				<li>
					<strong>Personalized lessons</strong> - Adapt content to your skill level and preferences
				</li>
				<li><strong>Progress tracking</strong> - Monitor your learning journey and achievements</li>
				<li><strong>AI tutoring</strong> - Provide contextual language assistance</li>
				<li>
					<strong>Voice customization</strong> - Use your preferred AI voice for conversations
				</li>
			</ul>

			<h3>Service Improvement</h3>
			<ul>
				<li><strong>Feature development</strong> - Understand which features are most valuable</li>
				<li>
					<strong>Content optimization</strong> - Improve lesson quality and difficulty curves
				</li>
				<li><strong>Performance monitoring</strong> - Identify and fix technical issues</li>
				<li><strong>User experience</strong> - Make the app more intuitive and engaging</li>
			</ul>

			<h3>Communication</h3>
			<ul>
				<li>
					<strong>Account updates</strong> - Important changes to your subscription or account
				</li>
				<li><strong>Learning reminders</strong> - Help you maintain your study routine</li>
				<li><strong>Feature announcements</strong> - New capabilities and improvements</li>
			</ul>
		</section>

		<section class="privacy-section">
			<h2>Analytics and Tracking</h2>

			<h3>PostHog Analytics</h3>
			<p>
				We use PostHog to understand how you interact with our application and improve your learning
				experience. PostHog helps us:
			</p>
			<ul>
				<li>
					<strong>Track learning patterns</strong> - See which features help users progress fastest
				</li>
				<li>
					<strong>Optimize conversion flows</strong> - Improve the upgrade experience for premium features
				</li>
				<li>
					<strong>Identify user needs</strong> - Understand what drives engagement and retention
				</li>
				<li>
					<strong>Test new features</strong> - A/B test improvements to ensure they help users learn
					better
				</li>
			</ul>

			<h3>What PostHog Collects</h3>
			<ul>
				<li><strong>Page views</strong> - Which parts of the app you visit</li>
				<li><strong>Feature usage</strong> - How you interact with learning tools</li>
				<li><strong>Conversion events</strong> - When you upgrade or hit usage limits</li>
				<li>
					<strong>Session recordings</strong> - Anonymous recordings of app interactions (with sensitive
					data masked)
				</li>
				<li>
					<strong>User properties</strong> - Learning preferences, skill levels, subscription status
				</li>
			</ul>

			<h3>Privacy Protections in PostHog</h3>
			<ul>
				<li>
					<strong>Input masking</strong> - All form inputs are automatically masked to protect sensitive
					data
				</li>
				<li><strong>Respects DNT</strong> - Honors "Do Not Track" browser settings</li>
				<li><strong>Guest user protection</strong> - Only creates profiles for logged-in users</li>
				<li>
					<strong>Data retention</strong> - Analytics data is automatically deleted after 12 months
				</li>
			</ul>
		</section>

		<section class="privacy-section">
			<h2>Data Storage and Security</h2>

			<h3>Storage Locations</h3>
			<ul>
				<li>
					<strong>Primary database</strong> - PostgreSQL database hosted on secure cloud infrastructure
				</li>
				<li><strong>Audio files</strong> - Temporarily stored for processing, then deleted</li>
				<li><strong>Analytics data</strong> - PostHog servers (with privacy protections)</li>
				<li><strong>Payment data</strong> - Stripe's secure payment infrastructure</li>
			</ul>

			<h3>Security Measures</h3>
			<ul>
				<li>
					<strong>Encryption</strong> - All data transmitted and stored using industry-standard encryption
				</li>
				<li>
					<strong>Access controls</strong> - Strict authentication and authorization for database access
				</li>
				<li><strong>Regular audits</strong> - Security assessments and penetration testing</li>
				<li><strong>Data backup</strong> - Regular backups with encryption and access controls</li>
			</ul>

			<h3>Data Retention</h3>
			<ul>
				<li><strong>Account data</strong> - Retained while your account is active</li>
				<li><strong>Conversation history</strong> - Kept for learning progress tracking</li>
				<li>
					<strong>Audio recordings</strong> - Deleted after processing (typically within 24 hours)
				</li>
				<li><strong>Analytics data</strong> - Automatically deleted after 12 months</li>
				<li><strong>Payment records</strong> - Retained as required by financial regulations</li>
			</ul>
		</section>

		<section class="privacy-section">
			<h2>Data Sharing and Third Parties</h2>

			<h3>Service Providers</h3>
			<p>We work with trusted third-party services to provide our language learning platform:</p>
			<ul>
				<li><strong>OpenAI</strong> - AI language models for conversations and feedback</li>
				<li><strong>Stripe</strong> - Secure payment processing and subscription management</li>
				<li><strong>PostHog</strong> - Analytics and user behavior insights</li>
				<li><strong>Cloud infrastructure</strong> - Secure hosting and database services</li>
			</ul>

			<h3>Data Protection</h3>
			<ul>
				<li><strong>No selling</strong> - We never sell your personal data to third parties</li>
				<li><strong>Limited sharing</strong> - Only share data necessary for service provision</li>
				<li>
					<strong>Privacy agreements</strong> - All third parties must meet our privacy standards
				</li>
				<li><strong>Audit rights</strong> - We can audit third-party data handling practices</li>
			</ul>
		</section>

		<section class="privacy-section">
			<h2>Your Rights and Choices</h2>

			<h3>Access and Control</h3>
			<ul>
				<li><strong>View your data</strong> - Access all information we have about you</li>
				<li>
					<strong>Update preferences</strong> - Modify learning goals, skill levels, and settings
				</li>
				<li><strong>Delete conversations</strong> - Remove specific conversation history</li>
				<li><strong>Export data</strong> - Download your learning data in standard formats</li>
			</ul>

			<h3>Privacy Settings</h3>
			<ul>
				<li>
					<strong>Analytics opt-out</strong> - Disable PostHog tracking in your account settings
				</li>
				<li>
					<strong>Session recording control</strong> - Choose whether to allow session recordings
				</li>
				<li><strong>Communication preferences</strong> - Control email frequency and types</li>
				<li><strong>Data deletion</strong> - Request complete account deletion</li>
			</ul>

			<h3>Account Deletion</h3>
			<p>You can request complete deletion of your account and all associated data. This will:</p>
			<ul>
				<li>Permanently delete your profile and preferences</li>
				<li>Remove all conversation history and learning progress</li>
				<li>Cancel any active subscriptions</li>
				<li>Delete analytics data associated with your account</li>
			</ul>
		</section>

		<section class="privacy-section">
			<h2>Children's Privacy</h2>
			<p>
				Kaiwa is not intended for children under 13 years of age. We do not knowingly collect
				personal information from children under 13. If you are a parent or guardian and believe
				your child has provided us with personal information, please contact us immediately.
			</p>
		</section>

		<section class="privacy-section">
			<h2>International Data Transfers</h2>
			<p>
				Your data may be transferred to and processed in countries other than your own. We ensure
				that all data transfers comply with applicable data protection laws and implement
				appropriate safeguards to protect your information.
			</p>
		</section>

		<section class="privacy-section">
			<h2>Changes to This Policy</h2>
			<p>
				We may update this Privacy Policy from time to time. We will notify you of any changes by
				posting the new Privacy Policy on this page and updating the "Last updated" date.
				Significant changes will be communicated via email or in-app notifications.
			</p>
		</section>

		<section class="privacy-section">
			<h2>Contact Us</h2>
			<p>
				If you have any questions about this Privacy Policy or our data practices, please contact
				us:
			</p>
			<ul>
				<li><strong>Email</strong>: privacy@kaiwa.app</li>
				<li><strong>Support</strong>: support@kaiwa.app</li>
				<li><strong>Data requests</strong>: data@kaiwa.app</li>
			</ul>
		</section>
	</div>
</div>

<style>
	.privacy-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.6;
		color: #333;
	}

	.privacy-header {
		text-align: center;
		margin-bottom: 3rem;
		border-bottom: 2px solid #e5e7eb;
		padding-bottom: 2rem;
	}

	.privacy-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.last-updated {
		color: #6b7280;
		font-size: 0.9rem;
	}

	.privacy-section {
		margin-bottom: 3rem;
	}

	.privacy-section h2 {
		font-size: 1.8rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
		border-left: 4px solid #3b82f6;
		padding-left: 1rem;
	}

	.privacy-section h3 {
		font-size: 1.3rem;
		font-weight: 600;
		color: #374151;
		margin: 1.5rem 0 0.75rem 0;
	}

	.privacy-section p {
		margin-bottom: 1rem;
		color: #4b5563;
	}

	.privacy-section ul {
		margin: 1rem 0;
		padding-left: 1.5rem;
	}

	.privacy-section li {
		margin-bottom: 0.5rem;
		color: #4b5563;
	}

	.privacy-section strong {
		color: #1f2937;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.privacy-container {
			padding: 1rem;
		}

		.privacy-header h1 {
			font-size: 2rem;
		}

		.privacy-section h2 {
			font-size: 1.5rem;
		}

		.privacy-section h3 {
			font-size: 1.2rem;
		}
	}
</style>
