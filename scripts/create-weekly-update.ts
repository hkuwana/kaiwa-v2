#!/usr/bin/env tsx

/**
 * Script to create a new weekly update file from template
 *
 * Usage:
 *   pnpm run create-weekly-update
 *   pnpm run create-weekly-update -- --date 2025-01-25
 *   pnpm run create-weekly-update -- --template custom-template
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CreateWeeklyUpdateOptions {
	date?: string;
	template?: string;
}

function parseArgs(): CreateWeeklyUpdateOptions {
	const args = process.argv.slice(2);
	const options: CreateWeeklyUpdateOptions = {};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--date' && i + 1 < args.length) {
			options.date = args[i + 1];
			i++; // Skip next argument
		} else if (args[i] === '--template' && i + 1 < args.length) {
			options.template = args[i + 1];
			i++; // Skip next argument
		}
	}

	return options;
}

function getDateString(date?: string): string {
	if (date) {
		const parsedDate = new Date(date);
		if (isNaN(parsedDate.getTime())) {
			throw new Error(`Invalid date format: ${date}. Use YYYY-MM-DD format.`);
		}
		return parsedDate.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Default to current date
	return new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

function getFilename(date?: string): string {
	const targetDate = date ? new Date(date) : new Date();
	const month = String(targetDate.getMonth() + 1).padStart(2, '0');
	const day = String(targetDate.getDate()).padStart(2, '0');
	const year = targetDate.getFullYear();

	return `Updates-${month}-${day}-${year}.md`;
}

function loadTemplate(templateName?: string): string {
	const templatesDir = join(process.cwd(), 'weekly-updates', 'templates');
	const templateFile = templateName
		? join(templatesDir, `${templateName}.md`)
		: join(templatesDir, 'weekly-update-template.md');

	if (!existsSync(templateFile)) {
		throw new Error(`Template file not found: ${templateFile}`);
	}

	return readFileSync(templateFile, 'utf-8');
}

function createWeeklyUpdateFile(options: CreateWeeklyUpdateOptions): void {
	try {
		const dateString = getDateString(options.date);
		const filename = getFilename(options.date);
		const template = loadTemplate(options.template);

		// Replace template placeholders
		const content = template.replace(/\[DATE\]/g, dateString);

		const filePath = join(process.cwd(), 'weekly-updates', filename);

		// Check if file already exists
		if (existsSync(filePath)) {
			console.log(`⚠️  File already exists: ${filename}`);
			console.log('   Use a different date or delete the existing file first.');
			process.exit(1);
		}

		// Write the file
		writeFileSync(filePath, content);

		console.log(`✅ Created weekly update file: ${filename}`);
		console.log(`📁 Location: ${filePath}`);
		console.log(`📅 Date: ${dateString}`);
		console.log('\n📝 Next steps:');
		console.log('1. Edit the file to add your weekly updates');
		console.log('2. Replace bracketed placeholders with actual content');
		console.log('3. The file will be automatically included in the next weekly digest');
	} catch (error) {
		console.error('❌ Error creating weekly update file:', error);
		process.exit(1);
	}
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const options = parseArgs();
	createWeeklyUpdateFile(options);
}
