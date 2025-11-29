<script lang="ts">
	import { onMount } from 'svelte';
	import { trackPageView } from '$lib/analytics/posthog';
	import { SvelteDate } from 'svelte/reactivity';

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
	<meta property="og:url" content="https://trykaiwa.com/privacy" />
	<meta property="og:title" content="Privacy Policy - Kaiwa | Data Protection & Analytics" />
	<meta
		property="og:description"
		content="Learn how Kaiwa collects, uses, and protects your data for language learning. Understand our data practices, PostHog analytics, and privacy protections."
	/>
	<meta property="og:site_name" content="Kaiwa" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://trykaiwa.com/privacy" />
	<meta property="twitter:title" content="Privacy Policy - Kaiwa | Data Protection & Analytics" />
	<meta
		property="twitter:description"
		content="Learn how Kaiwa collects, uses, and protects your data for language learning. Understand our data practices, PostHog analytics, and privacy protections."
	/>

	<!-- Canonical URL -->
	<link rel="canonical" href="https://trykaiwa.com/privacy" />

	<!-- Structured Data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebPage",
			"name": "Privacy Policy - Kaiwa",
			"description": "Learn how Kaiwa collects, uses, and protects your data for language learning",
			"url": "https://trykaiwa.com/privacy",
			"publisher": {
				"@type": "Organization",
				"name": "Kaiwa",
				"url": "https://trykaiwa.com"
			},
			"dateModified": "2025-08-29"
		}
	</script>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-12 sm:py-16">
	<header class="border-b border-base-300 pb-6 text-center">
		<p class="text-sm font-semibold tracking-[0.08em] text-primary/70 uppercase">Privacy</p>
		<h1 class="mt-2 text-4xl font-bold text-primary sm:text-5xl">Privacy Policy</h1>
		<p class="mt-3 text-sm text-base-content/60">
			Last updated: {new SvelteDate().toLocaleDateString()}
		</p>
	</header>

	<div class="space-y-10 text-base leading-relaxed text-base-content/80">
		<section class="space-y-3">
			<h2 class="text-2xl font-semibold text-base-content">Introduction</h2>
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

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold text-base-content">Information We Collect</h2>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Account Information</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li><strong>Email address</strong> - Required for account creation and communication</li>
					<li><strong>Display name</strong> - Optional, for personalization</li>
					<li><strong>Google ID</strong> - If you sign up with Google authentication</li>
					<li><strong>Avatar URL</strong> - Optional profile picture</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Language Learning Data</h3>
				<ul class="list-disc space-y-2 pl-5">
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
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Conversation Data</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li><strong>Conversation content</strong> - Text messages exchanged with AI tutors</li>
					<li><strong>Audio recordings</strong> - Your voice during real-time conversations</li>
					<li><strong>Transcription data</strong> - Speech-to-text conversion of your audio</li>
					<li>
						<strong>Language analysis</strong> - Grammar, vocabulary, and pronunciation feedback
					</li>
					<li><strong>Session metadata</strong> - Duration, message count, comfort ratings</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Usage Analytics</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li><strong>Study time</strong> - Total minutes spent learning</li>
					<li><strong>Conversation frequency</strong> - How often you practice</li>
					<li><strong>Feature usage</strong> - Which learning modes you prefer</li>
					<li><strong>Progress tracking</strong> - Skill level changes over time</li>
					<li><strong>Device information</strong> - Browser type, device type</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Payment Information</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li><strong>Stripe customer ID</strong> - For subscription management</li>
					<li><strong>Subscription details</strong> - Plan type, billing cycle, status</li>
					<li><strong>Payment history</strong> - Transaction amounts and dates</li>
				</ul>
			</div>
		</section>

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold text-base-content">How We Use Your Information</h2>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Core Language Learning Features</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li>
						<strong>Personalized lessons</strong> - Adapt content to your skill level and preferences
					</li>
					<li>
						<strong>Progress tracking</strong> - Monitor your learning journey and achievements
					</li>
					<li><strong>AI tutoring</strong> - Provide contextual language assistance</li>
					<li>
						<strong>Voice customization</strong> - Use your preferred AI voice for conversations
					</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Service Improvement</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li>
						<strong>Feature development</strong> - Understand which features are most valuable
					</li>
					<li>
						<strong>Content optimization</strong> - Improve lesson quality and difficulty curves
					</li>
					<li><strong>Performance monitoring</strong> - Identify and fix technical issues</li>
					<li><strong>User experience</strong> - Make the app more intuitive and engaging</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Communication</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li>
						<strong>Account updates</strong> - Important changes to your subscription or account
					</li>
					<li><strong>Learning reminders</strong> - Help you maintain your study routine</li>
					<li><strong>Feature announcements</strong> - New capabilities and improvements</li>
				</ul>
			</div>
		</section>

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold text-base-content">Analytics and Tracking</h2>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">PostHog Analytics</h3>
				<p>
					We use PostHog to understand how you interact with our application and improve your
					learning experience. PostHog helps us:
				</p>
				<ul class="list-disc space-y-2 pl-5">
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
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">What PostHog Collects</h3>
				<ul class="list-disc space-y-2 pl-5">
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
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Privacy Protections in PostHog</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li>
						<strong>Input masking</strong> - All form inputs are automatically masked to protect sensitive
						data
					</li>
					<li><strong>Respects DNT</strong> - Honors "Do Not Track" browser settings</li>
					<li>
						<strong>Guest user protection</strong> - Only creates profiles for logged-in users
					</li>
					<li>
						<strong>Data retention</strong> - Analytics data is automatically deleted after 12 months
					</li>
				</ul>
			</div>
		</section>

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold text-base-content">Data Storage and Security</h2>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Storage Locations</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li>
						<strong>Primary database</strong> - PostgreSQL database hosted on secure cloud infrastructure
					</li>
					<li><strong>Audio files</strong> - Temporarily stored for processing, then deleted</li>
					<li><strong>Analytics data</strong> - PostHog servers (with privacy protections)</li>
					<li><strong>Payment data</strong> - Stripe's secure payment infrastructure</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Security Measures</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li>
						<strong>Encryption</strong> - All data transmitted and stored using industry-standard encryption
					</li>
					<li>
						<strong>Access controls</strong> - Strict authentication and authorization for database access
					</li>
					<li><strong>Regular audits</strong> - Security assessments and penetration testing</li>
					<li>
						<strong>Data backup</strong> - Regular backups with encryption and access controls
					</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Data Retention</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li><strong>Account data</strong> - Retained while your account is active</li>
					<li><strong>Conversation history</strong> - Kept for learning progress tracking</li>
					<li>
						<strong>Audio recordings</strong> - Deleted after processing (typically within 24 hours)
					</li>
					<li><strong>Analytics data</strong> - Automatically deleted after 12 months</li>
					<li><strong>Payment records</strong> - Retained as required by financial regulations</li>
				</ul>
			</div>
		</section>

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold text-base-content">Data Sharing and Third Parties</h2>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Service Providers</h3>
				<p>We work with trusted third-party services to provide our language learning platform:</p>
				<ul class="list-disc space-y-2 pl-5">
					<li><strong>OpenAI</strong> - AI language models for conversations and feedback</li>
					<li><strong>Stripe</strong> - Secure payment processing and subscription management</li>
					<li><strong>PostHog</strong> - Analytics and user behavior insights</li>
					<li><strong>Cloud infrastructure</strong> - Secure hosting and database services</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">OpenAI Data Sharing for Free Users</h3>
				<p>
					<strong>Free Tier Users:</strong> To operate and sustain our free tier, we may share certain
					data with OpenAI in accordance with OpenAI's privacy policy and data usage terms. This data
					sharing helps us maintain the free service while managing operational costs. The shared data
					may include:
				</p>
				<ul class="list-disc space-y-2 pl-5">
					<li>Conversation content and messages exchanged with AI tutors</li>
					<li>Learning interaction data and educational content usage</li>
					<li>Language practice sessions and AI-generated feedback</li>
				</ul>
				<p>
					<strong>Premium Users:</strong> Premium subscription users have enhanced data protection, and
					their data is not shared with OpenAI beyond the minimum necessary for service operation.
				</p>
				<p>
					<strong>Opt-Out Option:</strong> Free users can opt out of this data sharing by enabling the
					"Enhanced Data Privacy" option in their User Preferences settings. However, opting out may
					result in reduced service quality or feature limitations as we may need to limit usage to maintain
					operational sustainability.
				</p>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Data Protection</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li><strong>No selling</strong> - We never sell your personal data to third parties</li>
					<li>
						<strong>Limited sharing</strong> - Only share data necessary for service provision
					</li>
					<li>
						<strong>Privacy agreements</strong> - All third parties must meet our privacy standards
					</li>
					<li><strong>Audit rights</strong> - We can audit third-party data handling practices</li>
				</ul>
			</div>
		</section>

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold text-base-content">Your Rights and Choices</h2>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Access and Control</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li><strong>View your data</strong> - Access all information we have about you</li>
					<li>
						<strong>Update preferences</strong> - Modify learning goals, skill levels, and settings
					</li>
					<li><strong>Delete conversations</strong> - Remove specific conversation history</li>
					<li><strong>Export data</strong> - Download your learning data in standard formats</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Privacy Settings</h3>
				<ul class="list-disc space-y-2 pl-5">
					<li>
						<strong>Enhanced Data Privacy</strong> - Free users can opt out of OpenAI data sharing through
						this setting in User Preferences (may result in feature limitations)
					</li>
					<li>
						<strong>Analytics opt-out</strong> - Disable PostHog tracking in your account settings
					</li>
					<li>
						<strong>Session recording control</strong> - Choose whether to allow session recordings
					</li>
					<li><strong>Communication preferences</strong> - Control email frequency and types</li>
					<li><strong>Data deletion</strong> - Request complete account deletion</li>
				</ul>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold text-base-content">Account Deletion</h3>
				<p>You can request complete deletion of your account and all associated data. This will:</p>
				<ul class="list-disc space-y-2 pl-5">
					<li>Permanently delete your profile and preferences</li>
					<li>Remove all conversation history and learning progress</li>
					<li>Cancel any active subscriptions</li>
					<li>Delete analytics data associated with your account</li>
				</ul>
			</div>
		</section>

		<section class="space-y-3">
			<h2 class="text-2xl font-semibold text-base-content">Children's Privacy</h2>
			<p>
				Kaiwa is not intended for children under 13 years of age. We do not knowingly collect
				personal information from children under 13. If you are a parent or guardian and believe
				your child has provided us with personal information, please contact us immediately.
			</p>
		</section>

		<section class="space-y-3">
			<h2 class="text-2xl font-semibold text-base-content">International Data Transfers</h2>
			<p>
				Your data may be transferred to and processed in countries other than your own. We ensure
				that all data transfers comply with applicable data protection laws and implement
				appropriate safeguards to protect your information.
			</p>
		</section>

		<section class="space-y-3">
			<h2 class="text-2xl font-semibold text-base-content">Changes to This Policy</h2>
			<p>
				We may update this Privacy Policy from time to time. We will notify you of any changes by
				posting the new Privacy Policy on this page and updating the "Last updated" date.
				Significant changes will be communicated via email or in-app notifications.
			</p>
		</section>

		<section class="space-y-3">
			<h2 class="text-2xl font-semibold text-base-content">Contact Us</h2>
			<p>
				If you have any questions about this Privacy Policy or our data practices, please contact
				us:
			</p>
			<ul class="list-disc space-y-2 pl-5">
				<li><strong>Email</strong>: privacy@trykaiwa.com</li>
				<li><strong>Support</strong>: support@trykaiwa.com</li>
				<li><strong>Data requests</strong>: data@trykaiwa.com</li>
			</ul>
		</section>
	</div>
</div>
